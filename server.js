const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors()); 
app.use(express.json()); 

const db = mysql.createPool({
    uri: 'mysql://root:EBgJYHgtASfViyICRJKloXChVTJLXdYX@zephyr.proxy.rlwy.net:36227/railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado com sucesso ao banco de dados no Railway!');
        connection.release();
    }
});

// ==========================================
// ROTAS
// ==========================================

app.use(express.static(path.join(__dirname, 'public')));


// Rota de Cadastro
app.post('/api/register', (req, res) => {
    const { nome, email, senha } = req.body;

    db.query('SELECT email FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro no servidor' });
        if (results.length > 0) return res.status(400).json({ error: 'E-mail já cadastrado!' });

        const sql = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
        db.query(sql, [nome, email, senha], (err, result) => {
            if (err) return res.status(500).json({ error: 'Erro ao cadastrar' });
            res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
        });
    });
});

// Rota de Login
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
                    streak: user.streak, 
                    foto: user.foto, 
                    lastCompletion: user.lastCompletion,
                    // CORREÇÃO AQUI: Agora o login devolve o progresso do aluno!
                    nota_diagnostica: user.nota_diagnostica,
                    avaliacao_concluida: user.avaliacao_concluida,
                    mod1_concluido: user.mod1_concluido
                }
            });
        } else {
            res.status(401).json({ error: 'E-mail ou senha incorretos!' });
        }
    });
});

// Rota para Atualizar a Foto
app.post('/api/update-photo', (req, res) => {
    const { email, foto } = req.body;

    if (!email || !foto) {
        return res.status(400).json({ error: 'E-mail e foto são obrigatórios.' });
    }

    const sql = 'UPDATE usuarios SET foto = ? WHERE email = ?';
    db.query(sql, [foto, email], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar foto:', err);
            return res.status(500).json({ error: 'Erro no servidor ao salvar a foto.' });
        }
        res.status(200).json({ message: 'Foto atualizada com sucesso!' });
    });
});

// Rota para Salvar Nota
app.post('/api/salvar-nota', (req, res) => {
    const { email, nota } = req.body;

    if (!email) {
        return res.status(400).json({ erro: "Email não fornecido." });
    }

    //  Atualiza a coluna nota_diagnostica e avaliacao_concluida
    const query = "UPDATE usuarios SET nota_diagnostica = ?, avaliacao_concluida = true WHERE email = ?";
    
    db.query(query, [nota, email], (err, results) => {
        if (err) {
            console.error("Erro ao salvar nota no Railway:", err);
            return res.status(500).json({ erro: "Erro ao salvar no banco de dados." });
        }
        res.json({ sucesso: true, mensagem: "Nota salva com sucesso!" });
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// ==========================================
// ROTAS DO FÓRUM (CORRIGIDAS COM .promise())
// ==========================================

// 1. Rota para CRIAR um post
app.post('/api/forum/post', async (req, res) => {
    const { user_email, user_nome, user_foto, conteudo, imagem_url } = req.body;
    try {
        const query = `INSERT INTO forum_posts (user_email, user_nome, user_foto, conteudo, imagem_url) VALUES (?, ?, ?, ?, ?)`;
        // Adicionado .promise() antes de .query()
        await db.promise().query(query, [user_email, user_nome, user_foto, conteudo, imagem_url || null]);
        res.status(201).json({ message: "Post publicado com sucesso!" });
    } catch (error) {
        console.error("Erro ao publicar post:", error);
        res.status(500).json({ error: "Erro ao publicar post." });
    }
});

// 2. Rota para CRIAR um comentário
app.post('/api/forum/comment', async (req, res) => {
    const { post_id, user_email, user_nome, user_foto, comentario } = req.body;
    try {
        const query = `INSERT INTO forum_comentarios (post_id, user_email, user_nome, user_foto, comentario) VALUES (?, ?, ?, ?, ?)`;
        // Adicionado .promise() antes de .query()
        await db.promise().query(query, [post_id, user_email, user_nome, user_foto, comentario]);
        res.status(201).json({ message: "Comentário adicionado!" });
    } catch (error) {
        console.error("Erro ao adicionar comentário:", error);
        res.status(500).json({ error: "Erro ao adicionar comentário." });
    }
});

// 3. Rota para BUSCAR todos os posts e seus comentários
app.get('/api/forum/posts', async (req, res) => {
    try {
        // Adicionado .promise() antes de .query()
        const [posts] = await db.promise().query(`SELECT * FROM forum_posts ORDER BY criado_em DESC`);
        
        // Adicionado .promise() antes de .query()
        const [comentarios] = await db.promise().query(`SELECT * FROM forum_comentarios ORDER BY criado_em ASC`);
        
        // Agrupa os comentários dentro dos seus respectivos posts
        const postsComComentarios = posts.map(post => {
            return {
                ...post,
                comentarios: comentarios.filter(c => c.post_id === post.id)
            };
        });

        res.status(200).json(postsComComentarios);
    } catch (error) {
        console.error("Erro ao carregar o fórum:", error);
        res.status(500).json({ error: "Erro ao carregar o fórum." });
    }
});

// 4. Rota para CURTIR / DESCURTIR um post
app.put('/api/forum/post/:id/like', async (req, res) => {
    const { user_email } = req.body;
    const postId = req.params.id;

    if (!user_email) return res.status(400).json({ error: "Email do usuário é obrigatório." });

    try {
        // Verifica se esse usuário já curtiu esse post
        const [jaCurtiu] = await db.promise().query(
            `SELECT * FROM forum_curtidas WHERE post_id = ? AND user_email = ?`, 
            [postId, user_email]
        );

        if (jaCurtiu.length > 0) {
            // Se já curtiu, nós apagamos o registro e tiramos 1 curtida do post (Descurtir)
            await db.promise().query(`DELETE FROM forum_curtidas WHERE post_id = ? AND user_email = ?`, [postId, user_email]);
            await db.promise().query(`UPDATE forum_posts SET curtidas = curtidas - 1 WHERE id = ?`, [postId]);
            return res.status(200).json({ message: "Post descurtido!" });
        } else {
            // Se não curtiu, nós salvamos o registro e somamos 1 curtida (Curtir)
            await db.promise().query(`INSERT INTO forum_curtidas (post_id, user_email) VALUES (?, ?)`, [postId, user_email]);
            await db.promise().query(`UPDATE forum_posts SET curtidas = curtidas + 1 WHERE id = ?`, [postId]);
            return res.status(200).json({ message: "Post curtido!" });
        }
    } catch (error) {
        console.error("Erro ao curtir post:", error);
        res.status(500).json({ error: "Erro ao curtir/descurtir post." });
    }
});

// 5. Rota para DELETAR um post
app.delete('/api/forum/post/:id', async (req, res) => {
    try {
        await db.promise().query(`DELETE FROM forum_posts WHERE id = ?`, [req.params.id]);
        res.status(200).json({ message: "Post deletado!" });
    } catch (error) {
        console.error("Erro ao deletar post:", error);
        res.status(500).json({ error: "Erro ao deletar post." });
    }
});

// 6. Rota para EDITAR um post
app.put('/api/forum/post/:id', async (req, res) => {
    const { conteudo } = req.body;
    try {
        await db.promise().query(`UPDATE forum_posts SET conteudo = ? WHERE id = ?`, [conteudo, req.params.id]);
        res.status(200).json({ message: "Post atualizado!" });
    } catch (error) {
        console.error("Erro ao atualizar post:", error);
        res.status(500).json({ error: "Erro ao atualizar post." });
    }
});

// ROTA PARA ATUALIZAR PERFIL (Nome e Senha)
app.post('/api/update-profile', async (req, res) => {
    const { email, nome, senha } = req.body;
    
    if (!email || !nome) return res.status(400).json({ error: "Email e nome são obrigatórios." });

    try {
        if (senha) {
            // Se o usuário digitou uma senha nova, atualiza o nome e a senha
            await db.promise().query(
                `UPDATE usuarios SET nome = ?, senha = ? WHERE email = ?`, 
                [nome, senha, email]
            );
        } else {
            // Se não, atualiza só o nome
            await db.promise().query(
                `UPDATE usuarios SET nome = ? WHERE email = ?`, 
                [nome, email]
            );
        }
        res.status(200).json({ message: "Perfil atualizado!" });
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

// ROTA PARA COMPRAR ITENS DA LOJA (Gastar XP)
app.post('/api/buy-item', async (req, res) => {
    const { email, item_id, custo } = req.body;

    try {
        // 1. Busca os dados atuais do usuário
        const [rows] = await db.promise().query(`SELECT xp, streak, itens_comprados FROM usuarios WHERE email = ?`, [email]);
        if (rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado." });

        const user = rows[0];

        // 2. Verifica se tem XP suficiente (Segurança no backend)
        if (user.xp < custo) {
            return res.status(400).json({ error: "XP insuficiente!" });
        }

        // 3. Aplica a lógica dependendo do que ele comprou
        let novoXp = user.xp - custo;

        if (item_id === 'restaurar_ofensiva') {
            // Soma +1 no streak
            let novoStreak = (user.streak || 0) + 1;
            await db.promise().query(`UPDATE usuarios SET xp = ?, streak = ? WHERE email = ?`, [novoXp, novoStreak, email]);
        } else {
            // É um tema. Salva na lista de itens comprados
            let itens = user.itens_comprados ? JSON.parse(user.itens_comprados) : [];
            if (!itens.includes(item_id)) {
                itens.push(item_id);
            }
            await db.promise().query(`UPDATE usuarios SET xp = ?, itens_comprados = ? WHERE email = ?`, [novoXp, JSON.stringify(itens), email]);
        }

        res.status(200).json({ message: "Compra realizada com sucesso!" });

    } catch (error) {
        console.error("Erro ao processar compra:", error);
        res.status(500).json({ error: "Erro ao processar a compra no servidor." });
    }
});

// ==========================================
// ROTAS DE PROGRESSO E OFENSIVA (STREAK)
// ==========================================

// Rota para BUSCAR os dados atualizados do usuário (XP e Ofensiva)
app.get('/api/get-user', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório.' });
    }

    try {
        const query = 'SELECT nome, email, xp, streak, foto FROM usuarios WHERE email = ?';
        const [rows] = await db.promise().query(query, [email]);

        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ error: 'Usuário não encontrado.' });
        }
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar dados.' });
    }
});

// Rota para ATUALIZAR o XP e a Ofensiva (Streak) no banco
app.post('/api/update-progress', async (req, res) => {
    const { email, xp, streak } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório.' });
    }

    try {
        const query = 'UPDATE usuarios SET xp = ?, streak = ? WHERE email = ?';
        await db.promise().query(query, [xp, streak, email]);
        
        res.status(200).json({ message: 'Progresso atualizado com sucesso no banco!' });
    } catch (error) {
        console.error('Erro ao atualizar progresso:', error);
        res.status(500).json({ error: 'Erro no servidor ao salvar progresso.' });
    }
});

