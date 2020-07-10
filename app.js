const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 7000; //porta padrão
const mysql = require('mysql');
require("dotenv-safe").config();
var jwt = require('jsonwebtoken');
const { response } = require('express');

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

//configurando o body parser para pegar POSTS mais tarde
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Autorização
function verifyJWT(req, res, next){
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, process.env.SECRET, function(err, decoded) {
      if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
      
      // se tudo estiver ok, salva no request para uso posterior
      req.userId = decoded.id;
      next();
    });
}

//definindo as rotas
const router = express.Router();
router.get('/', (req, res) => res.json({ message: 'Funcionando!' }));
app.use('/', router);

//inicia o servidor
app.listen(port);
console.log('API funcionando!');

const connection = mysql.createConnection({
    host: '192.168.1.34',
    port: 3306,
    user: 'rodrigo',
    password: 'rofe@2020',
    database: 'alugueis'
});

function execSQLQuery(sqlQry, res) {

    const connection = mysql.createConnection({
        host: '192.168.1.34',
        port: 3306,
        user: 'rodrigo',
        password: 'rofe@2020',
        database: 'alugueis'
    });

    connection.query(sqlQry, function(error, results, fields) {
        if (error)
            res.json(error);
        else
            res.json(results);
        connection.end();
        console.log('Query Executada Com Sucesso!');
    });
}


//################################################ROTAS#####################################################


//LISTAR CONTRATOS
router.get('/contratos',verifyJWT, (req, res, next) => {
    execSQLQuery('SELECT * FROM contratos', res);
})

//LISTAR IMOVEIS
router.get('/imoveis',verifyJWT, (req, res, next) => {
    execSQLQuery('SELECT * FROM imoveis', res);
})

//LISTAR LOCATARIOS
router.get('/locatarios',verifyJWT, (req, res, next) => {
    execSQLQuery('SELECT * FROM locatario', res);
})

//LOGIN
router.post('/users/', (req, res) => {
        
        const login = req.body.login
        const passwd = req.body.passwd
        
        //const login = req.params.login;
        const query="select * from login where login=?"
        
        connection.query(query,[login],(err, rows)=>{
            if (err){        
                console.log(err)
                res.status(500)
                res.json({
                  auth: false,
                  "message": "Internal Server Error"
                })
            }else if (rows.length > 0){
                if(login== rows[0].login){
                    if(passwd==rows[0].passwd){
                        const id = rows[0].idlogin; //esse id viria do banco de dados
                        var token = jwt.sign({ id }, process.env.SECRET, {
                        expiresIn: 300 // expires in 5min
                        });
                        res.json({
                            "username": rows[0].login,
                            "password":rows[0].passwd,
                            auth: true, 
                            token: token
                            })
                    }else{
                        res.status(404)
                        res.json({"message":"PASSWORD INCORRETO"})
                    }
                }else{
                res.status(404)
                res.json({"message":"LOGIN INCORRETO"})    
                }  
            }else {
                res.status(404)
                res.json({"message":"ERROR 404 - NENHUM REGISTRO ENCONTRADO"})
              }    
        })  
})

//CADASTRO
router.post('/users/signup',(req,res) => {

    const nome = req.body.nome
    const cpfcnpj = req.body.cpfcnpj
    const mail = req.body.mail
    const passwd = req.body.passwd
    const query="select * from login where cnpj=?"
    const query2="select * from login where email=?"
    const query3="INSERT INTO login (nome,cpfcnpj,login,email,passwd) VALUES (?,?,?,?,?)"

    if(!nome){
        res.json({"message":"Nome Nulo"}) 
    }else if(!cpfcnpj){
        res.json({"message":"CPF/CNPJ Invalido"}) 
    }else if(!mail){
        res.json({"message":"E-mail Invalido"}) 
    }else if(!passwd){
        res.json({"message":"Senha Nula"}) 
    }else{
        
        
        connection.query(query,[cpfcnpj],(err, rows)=>{
            if (err){        
                console.log(err)
                res.status(500)
                res.json({
                  auth: false,
                  "message": "Internal Server Error"
                })
            }else if (rows.length > 0){
                //res.json({"message":rows[0].cnpj})
                //console.log(rows[0])
                if(cpfcnpj==rows[0].cnpj){
                    return res.json({"message":"CNPJ JA CADASTRADO"})
                    
                }else{
                    return res.json({"message":"NADA"})
                            
                }
            }connection.query(query2,[mail],(err, rows)=>{
                if (err){        
                    console.log(err)
                    res.status(500)
                    res.json({
                      auth: false,
                      "message": "Internal Server Error"
                    })
                }else if (rows.length > 0){
                    return res.json({"message":"Email ja Cadastrado"})

                }else{
                    connection.query(query3,[nome,cpfcnpj,mail,mail,passwd],(err, rows)=>{
                        if (err){        
                            console.log(err)
                            res.status(500)
                            res.json({
                              auth: false,
                              "message": "Internal Server Error"
                            })
                        }else{
                            return res.json({"message":"Cadastro Realizado com sucesso!"})
                            
                        }
                    })
                    //return res.json({"message":"Cadastro Realizado com sucesso!"})
                    //execSQLQuery(`INSERT INTO login (nome,cnpj,login,email,passwd) VALUES ('${nome}','${cpfcnpj}','${mail}','${mail}','${passwd}')`, res);
                    
                }
            })
            
            
        })
    }
    
})

//LISTAR AGENDAMENTOS POR ID
router.get('/agendamentos/:id?', (req, res) => {
        let filter = '';
        if (req.params.id) filter = ' WHERE idagendamentos=' + parseInt(req.params.id);
        execSQLQuery('SELECT * FROM agendamentos' + filter, res);
    })

    //EXCLUIR AGENDAMENTOS POR ID
router.delete('/agendamentos/:id', (req, res) => {
        execSQLQuery('DELETE FROM agendamentos WHERE idagendamentos=' + parseInt(req.params.id), res);
    })
    
    // ADICIONAR CLIENTES
    router.post('/agendamentoadd', (req, res) => {
    const title = req.body.title.substring(0, 150);
    const cor = req.body.cor.substring(0, 7);
    const start = req.body.start.substring(0, 11);
    const end = req.body.end.substring(0, 11);
    const fornecedor = req.body.fornecedor.substring(0, 11);
    const responsavel = req.body.responsavel.substring(0, 11);
    const natureza = req.body.natureza.substring(0, 11);
    const confirmado = req.body.confirmado.substring(0, 11);
    const idfklogin = req.body.idfklogin.substring(0, 4);
    const nf = req.body.nf.substring(0, 11);
    const nfimg = req.body.nfimg.substring(0, 11);

    console.log('title->' + title);
    console.log('color->' + cor);
    console.log('start->' + start);
    console.log('end->' + end);
    console.log('fornecedor->' + fornecedor);
    console.log('responsavel->' + responsavel);
    console.log('natureza->' + natureza);
    console.log('confirmado->' + confirmado);
    console.log('idfklogin->' + idfklogin);
    console.log('nf->' + nf);
    console.log('nfimg->' + nfimg);
    execSQLQuery(`INSERT INTO agendamentos(title,color,start,end,fornecedor,responsavel,natureza,confirmado,idfklogin,nf,nfimg) VALUES ('${title}','${cor}','${start}','${end}','${fornecedor}','${responsavel}','${natureza}','${confirmado}','${idfklogin}','${nf}','${nfimg}')`, res);

});
