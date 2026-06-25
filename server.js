const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createPool({
    uri: process.env.mysql://root:EBgJYHgtASfViyICRJKloXChVTJLXdYX@zephyr.proxy.rlwy.net:36227/railway ,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

function boolBanco(valor) {
    return valor === true || valor === 1 || valor === '1' || valor === 'true';
}

function lerJsonSeguro(valor) {
    if (!valor) return {};
    try {
        return typeof valor === 'string' ? JSON.parse(valor) : valor;
    } catch (error) {
        return {};
    }
}

async function garantirColuna(tabela, coluna, definicao) {
    const [rows] = await db.promise().query('SHOW COLUMNS FROM ?? LIKE ?', [tabela, coluna]);

    if (rows.length === 0) {
        await db.promise().query(`ALTER TABLE \`${tabela}\` ADD COLUMN \`${coluna}\` ${definicao}`);
        console.log(`Coluna criada: ${tabela}.${coluna}`);
    }
}

async function prepararBanco() {
    try {
        await garantirColuna('usuarios', 'foto', 'LONGTEXT NULL');
        await garantirColuna('usuarios', 'xp', 'INT DEFAULT 0');
        await garantirColuna('usuarios', 'streak', 'INT DEFAULT 0');
        await garantirColuna('usuarios', 'lastCompletion', 'VARCHAR(100) NULL');
        await garantirColuna('usuarios', 'itens_comprados', 'TEXT NULL');
        await garantirColuna('usuarios', 'nota_diagnostica', 'DECIMAL(5,2) NULL');
        await garantirColuna('usuarios', 'avaliacao_concluida', 'TINYINT(1) DEFAULT 0');
        await garantirColuna('usuarios', 'mod1_concluido', 'TINYINT(1) DEFAULT 0');
        await garantirColuna('usuarios', 'mod2_concluido', 'TINYINT(1) DEFAULT 0');
        await garantirColuna('usuarios', 'certificado_liberado', 'TINYINT(1) DEFAULT 0');
        await garantirColuna('usuarios', 'progresso_modulos', 'TEXT NULL');

        console.log('Estrutura de progresso verificada com sucesso.');
    } catch (error) {
        console.error('Erro ao preparar colunas do banco:', error.message);
    }
}

function montarProgresso(user) {
    const extra = lerJsonSeguro(user.progresso_modulos);

    const avaliacaoConcluida =
        boolBanco(user.avaliacao_concluida) || boolBanco(extra.avaliacao);

    const mod1Concluido =
        boolBanco(user.mod1_concluido) || boolBanco(extra.mod1);

    const mod2Concluido =
        boolBanco(user.mod2_concluido) || boolBanco(extra.mod2);

    const unidade1Concluida =
        boolBanco(extra.unidade1) || boolBanco(extra.unidade1_concluida);

    const unidade2Concluida =
        boolBanco(extra.unidade2) || boolBanco(extra.unidade2_concluida);

    const unidade3Concluida =
        boolBanco(extra.unidade3) || boolBanco(extra.unidade3_concluida);

    const certificadoLiberado =
        boolBanco(user.certificado_liberado) ||
        boolBanco(extra.certificado) ||
        (avaliacaoConcluida && mod1Concluido && mod2Concluido);

    return {
        nota_diagnostica: user.nota_diagnostica,
        avaliacao_concluida: avaliacaoConcluida,
        mod1_concluido: mod1Concluido,
        mod2_concluido: mod2Concluido,
        certificado_liberado: certificadoLiberado,
        unidade1_concluida: unidade1Concluida,
        unidade2_concluida: unidade2Concluida,
        unidade3_concluida: unidade3Concluida,
        atualizado_em: extra.atualizado_em || null
    };
}

async function buscarUsuarioCompleto(email) {
    const [rows] = await db.promise().query(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
    );

    return rows[0] || null;
}

async function atualizarJsonProgresso(email, alteracoes) {
    const usuario = await buscarUsuarioCompleto(email);
    if (!usuario) return null;

    const progressoAtual = lerJsonSeguro(usuario.progresso_modulos);

    const novoProgresso = {
        ...progressoAtual,
        ...alteracoes,
        atualizado_em: new Date().toISOString()
    };

    return novoProgresso;
}

db.getConnection((err, connection) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado com sucesso ao banco de dados!');
        connection.release();
        prepararBanco();
    }
});

// ==========================================
// ROTAS PRINCIPAIS
// ==========================================

app.post('/api/register', (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({
            error: 'Nome, e-mail e senha são obrigatórios.'
        });
    }

    db.query('SELECT email FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro no servidor' });

        if (results.length > 0) {
            return res.status(400).json({ error: 'E-mail já cadastrado!' });
        }

        const progressoInicial = JSON.stringify({
            avaliacao: false,
            mod1: false,
            mod2: false,
            certificado: false,
            unidade1: false,
            unidade2: false,
            unidade3: false,
            atualizado_em: new Date().toISOString()
        });

        const sql = `
            INSERT INTO usuarios 
            (nome, email, senha, progresso_modulos) 
            VALUES (?, ?, ?, ?)
        `;

        db.query(sql, [nome, email, senha, progressoInicial], (err) => {
            if (err) return res.status(500).json({ error: 'Erro ao cadastrar' });

            res.status(201).json({
                message: 'Usuário cadastrado com sucesso!'
            });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    const sql = 'SELECT * FROM usuarios WHERE email = ? AND senha = ?';

    db.query(sql, [email, senha], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro no servidor' });

        if (results.length > 0) {
            const user = results[0];

            res.status(200).json({
                message: 'Login realizado com sucesso!',
                user: {
                    nome: user.nome,
                    email: user.email,
                    streak: user.streak || 0,
                    xp: user.xp || 0,
                    foto: user.foto,
                    lastCompletion: user.lastCompletion,
                    nota_diagnostica: user.nota_diagnostica,
                    avaliacao_concluida: user.avaliacao_concluida,
                    mod1_concluido: user.mod1_concluido,
                    mod2_concluido: user.mod2_concluido,
                    certificado_liberado: user.certificado_liberado,
                    progresso_modulos: user.progresso_modulos
                }
            });
        } else {
            res.status(401).json({
                error: 'E-mail ou senha incorretos!'
            });
        }
    });
});

app.post('/api/update-photo', (req, res) => {
    const { email, foto } = req.body;

    if (!email || !foto) {
        return res.status(400).json({
            error: 'E-mail e foto são obrigatórios.'
        });
    }

    const sql = 'UPDATE usuarios SET foto = ? WHERE email = ?';

    db.query(sql, [foto, email], (err) => {
        if (err) {
            console.error('Erro ao atualizar foto:', err);
            return res.status(500).json({
                error: 'Erro no servidor ao salvar a foto.'
            });
        }

        res.status(200).json({
            message: 'Foto atualizada com sucesso!'
        });
    });
});

app.post('/api/salvar-nota', async (req, res) => {
    const { email, nota } = req.body;

    if (!email) {
        return res.status(400).json({
            erro: 'Email não fornecido.'
        });
    }

    try {
        const progressoAtualizado = await atualizarJsonProgresso(email, {
            avaliacao: true
        });

        if (!progressoAtualizado) {
            return res.status(404).json({
                erro: 'Usuário não encontrado.'
            });
        }

        await db.promise().query(
            `UPDATE usuarios 
             SET nota_diagnostica = ?, 
                 avaliacao_concluida = 1, 
                 progresso_modulos = ? 
             WHERE email = ?`,
            [nota, JSON.stringify(progressoAtualizado), email]
        );

        const usuario = await buscarUsuarioCompleto(email);

        res.json({
            sucesso: true,
            mensagem: 'Nota salva com sucesso!',
            progresso: montarProgresso(usuario)
        });
    } catch (err) {
        console.error('Erro ao salvar nota no banco:', err);

        res.status(500).json({
            erro: 'Erro ao salvar no banco de dados.'
        });
    }
});

// ==========================================
// ROTAS DE PROGRESSO DOS MÓDULOS E UNIDADES
// ==========================================

app.get('/api/modulos/progresso', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({
            error: 'E-mail é obrigatório.'
        });
    }

    try {
        const usuario = await buscarUsuarioCompleto(email);

        if (!usuario) {
            return res.status(404).json({
                error: 'Usuário não encontrado.'
            });
        }

        res.status(200).json({
            progresso: montarProgresso(usuario)
        });
    } catch (error) {
        console.error('Erro ao buscar progresso dos módulos:', error);

        res.status(500).json({
            error: 'Erro ao buscar progresso no banco.'
        });
    }
});

app.post('/api/modulos/salvar', async (req, res) => {
    const { email, modulo, concluido } = req.body;

    if (!email || !modulo) {
        return res.status(400).json({
            error: 'E-mail e módulo são obrigatórios.'
        });
    }

    const permitido = [
        'avaliacao',
        'mod1',
        'mod2',
        'certificado',
        'unidade1',
        'unidade2',
        'unidade3'
    ];

    if (!permitido.includes(modulo)) {
        return res.status(400).json({
            error: 'Módulo inválido.'
        });
    }

    const valor = concluido === undefined ? true : !!concluido;

    try {
        const progressoAtualizado = await atualizarJsonProgresso(email, {
            [modulo]: valor
        });

        if (!progressoAtualizado) {
            return res.status(404).json({
                error: 'Usuário não encontrado.'
            });
        }

        const campos = ['progresso_modulos = ?'];
        const params = [JSON.stringify(progressoAtualizado)];

        if (modulo === 'avaliacao') {
            campos.push('avaliacao_concluida = ?');
            params.push(valor ? 1 : 0);
        }

        if (modulo === 'mod1') {
            campos.push('mod1_concluido = ?');
            params.push(valor ? 1 : 0);
        }

        if (modulo === 'mod2') {
            campos.push('mod2_concluido = ?');
            params.push(valor ? 1 : 0);
        }

        if (modulo === 'certificado') {
            campos.push('certificado_liberado = ?');
            params.push(valor ? 1 : 0);
        }

        params.push(email);

        await db.promise().query(
            `UPDATE usuarios SET ${campos.join(', ')} WHERE email = ?`,
            params
        );

        const usuario = await buscarUsuarioCompleto(email);

        res.status(200).json({
            message: 'Progresso salvo no banco!',
            progresso: montarProgresso(usuario)
        });
    } catch (error) {
        console.error('Erro ao salvar progresso:', error);

        res.status(500).json({
            error: 'Erro ao salvar progresso no banco.'
        });
    }
});

app.post('/api/modulos/zerar', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            error: 'E-mail é obrigatório.'
        });
    }

    try {
        const progressoInicial = {
            avaliacao: false,
            mod1: false,
            mod2: false,
            certificado: false,
            unidade1: false,
            unidade2: false,
            unidade3: false,
            atualizado_em: new Date().toISOString()
        };

        await db.promise().query(
            `UPDATE usuarios
             SET nota_diagnostica = NULL,
                 avaliacao_concluida = 0,
                 mod1_concluido = 0,
                 mod2_concluido = 0,
                 certificado_liberado = 0,
                 progresso_modulos = ?
             WHERE email = ?`,
            [JSON.stringify(progressoInicial), email]
        );

        const usuario = await buscarUsuarioCompleto(email);

        if (!usuario) {
            return res.status(404).json({
                error: 'Usuário não encontrado.'
            });
        }

        res.status(200).json({
            message: 'Progresso zerado no banco!',
            progresso: montarProgresso(usuario)
        });
    } catch (error) {
        console.error('Erro ao zerar progresso:', error);

        res.status(500).json({
            error: 'Erro ao zerar progresso no banco.'
        });
    }
});

// ==========================================
// ROTAS DO FÓRUM
// ==========================================

app.post('/api/forum/post', async (req, res) => {
    const { user_email, user_nome, user_foto, conteudo, imagem_url } = req.body;

    try {
        const query = `
            INSERT INTO forum_posts 
            (user_email, user_nome, user_foto, conteudo, imagem_url) 
            VALUES (?, ?, ?, ?, ?)
        `;

        await db.promise().query(query, [
            user_email,
            user_nome,
            user_foto,
            conteudo,
            imagem_url || null
        ]);

        res.status(201).json({
            message: 'Post publicado com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao publicar post:', error);

        res.status(500).json({
            error: 'Erro ao publicar post.'
        });
    }
});

app.post('/api/forum/comment', async (req, res) => {
    const { post_id, user_email, user_nome, user_foto, comentario } = req.body;

    try {
        const query = `
            INSERT INTO forum_comentarios 
            (post_id, user_email, user_nome, user_foto, comentario) 
            VALUES (?, ?, ?, ?, ?)
        `;

        await db.promise().query(query, [
            post_id,
            user_email,
            user_nome,
            user_foto,
            comentario
        ]);

        res.status(201).json({
            message: 'Comentário adicionado!'
        });
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);

        res.status(500).json({
            error: 'Erro ao adicionar comentário.'
        });
    }
});

app.get('/api/forum/posts', async (req, res) => {
    try {
        const [posts] = await db.promise().query(
            'SELECT * FROM forum_posts ORDER BY criado_em DESC'
        );

        const [comentarios] = await db.promise().query(
            'SELECT * FROM forum_comentarios ORDER BY criado_em ASC'
        );

        const postsComComentarios = posts.map(post => ({
            ...post,
            comentarios: comentarios.filter(c => c.post_id === post.id)
        }));

        res.status(200).json(postsComComentarios);
    } catch (error) {
        console.error('Erro ao carregar o fórum:', error);

        res.status(500).json({
            error: 'Erro ao carregar o fórum.'
        });
    }
});

app.put('/api/forum/post/:id/like', async (req, res) => {
    const { user_email } = req.body;
    const postId = req.params.id;

    if (!user_email) {
        return res.status(400).json({
            error: 'Email do usuário é obrigatório.'
        });
    }

    try {
        const [jaCurtiu] = await db.promise().query(
            'SELECT * FROM forum_curtidas WHERE post_id = ? AND user_email = ?',
            [postId, user_email]
        );

        if (jaCurtiu.length > 0) {
            await db.promise().query(
                'DELETE FROM forum_curtidas WHERE post_id = ? AND user_email = ?',
                [postId, user_email]
            );

            await db.promise().query(
                'UPDATE forum_posts SET curtidas = GREATEST(curtidas - 1, 0) WHERE id = ?',
                [postId]
            );

            return res.status(200).json({
                message: 'Post descurtido!'
            });
        }

        await db.promise().query(
            'INSERT INTO forum_curtidas (post_id, user_email) VALUES (?, ?)',
            [postId, user_email]
        );

        await db.promise().query(
            'UPDATE forum_posts SET curtidas = curtidas + 1 WHERE id = ?',
            [postId]
        );

        return res.status(200).json({
            message: 'Post curtido!'
        });
    } catch (error) {
        console.error('Erro ao curtir post:', error);

        res.status(500).json({
            error: 'Erro ao curtir/descurtir post.'
        });
    }
});

app.delete('/api/forum/post/:id', async (req, res) => {
    try {
        await db.promise().query(
            'DELETE FROM forum_posts WHERE id = ?',
            [req.params.id]
        );

        res.status(200).json({
            message: 'Post deletado!'
        });
    } catch (error) {
        console.error('Erro ao deletar post:', error);

        res.status(500).json({
            error: 'Erro ao deletar post.'
        });
    }
});

app.put('/api/forum/post/:id', async (req, res) => {
    const { conteudo } = req.body;

    try {
        await db.promise().query(
            'UPDATE forum_posts SET conteudo = ? WHERE id = ?',
            [conteudo, req.params.id]
        );

        res.status(200).json({
            message: 'Post atualizado!'
        });
    } catch (error) {
        console.error('Erro ao atualizar post:', error);

        res.status(500).json({
            error: 'Erro ao atualizar post.'
        });
    }
});

// ==========================================
// ROTAS DE PERFIL, LOJA, XP E OFENSIVA
// ==========================================

app.post('/api/update-profile', async (req, res) => {
    const { email, nome, senha } = req.body;

    if (!email || !nome) {
        return res.status(400).json({
            error: 'Email e nome são obrigatórios.'
        });
    }

    try {
        if (senha) {
            await db.promise().query(
                'UPDATE usuarios SET nome = ?, senha = ? WHERE email = ?',
                [nome, senha, email]
            );
        } else {
            await db.promise().query(
                'UPDATE usuarios SET nome = ? WHERE email = ?',
                [nome, email]
            );
        }

        res.status(200).json({
            message: 'Perfil atualizado!'
        });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);

        res.status(500).json({
            error: 'Erro interno no servidor.'
        });
    }
});

app.post('/api/buy-item', async (req, res) => {
    const { email, item_id, custo } = req.body;

    try {
        const [rows] = await db.promise().query(
            'SELECT xp, streak, itens_comprados FROM usuarios WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Usuário não encontrado.'
            });
        }

        const user = rows[0];

        if ((user.xp || 0) < custo) {
            return res.status(400).json({
                error: 'XP insuficiente!'
            });
        }

        const novoXp = (user.xp || 0) - custo;

        if (item_id === 'restaurar_ofensiva') {
            const novoStreak = (user.streak || 0) + 1;

            await db.promise().query(
                'UPDATE usuarios SET xp = ?, streak = ? WHERE email = ?',
                [novoXp, novoStreak, email]
            );
        } else {
            const itens = user.itens_comprados
                ? JSON.parse(user.itens_comprados)
                : [];

            if (!itens.includes(item_id)) {
                itens.push(item_id);
            }

            await db.promise().query(
                'UPDATE usuarios SET xp = ?, itens_comprados = ? WHERE email = ?',
                [novoXp, JSON.stringify(itens), email]
            );
        }

        res.status(200).json({
            message: 'Compra realizada com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao processar compra:', error);

        res.status(500).json({
            error: 'Erro ao processar a compra no servidor.'
        });
    }
});

app.get('/api/get-user', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({
            error: 'E-mail é obrigatório.'
        });
    }

    try {
        const usuario = await buscarUsuarioCompleto(email);

        if (usuario) {
            res.status(200).json({
                nome: usuario.nome,
                email: usuario.email,
                xp: usuario.xp || 0,
                streak: usuario.streak || 0,
                foto: usuario.foto,
                progresso: montarProgresso(usuario)
            });
        } else {
            res.status(404).json({
                error: 'Usuário não encontrado.'
            });
        }
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);

        res.status(500).json({
            error: 'Erro no servidor ao buscar dados.'
        });
    }
});

app.post('/api/update-progress', async (req, res) => {
    const { email, xp, streak } = req.body;

    if (!email) {
        return res.status(400).json({
            error: 'E-mail é obrigatório.'
        });
    }

    try {
        await db.promise().query(
            'UPDATE usuarios SET xp = ?, streak = ? WHERE email = ?',
            [xp, streak, email]
        );

        res.status(200).json({
            message: 'Progresso atualizado com sucesso no banco!'
        });
    } catch (error) {
        console.error('Erro ao atualizar progresso:', error);

        res.status(500).json({
            error: 'Erro no servidor ao salvar progresso.'
        });
    }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
