/**
 * FindIt - regras de cadastro e login (camada de servicos).
 * Valida dados no servidor e usa bcrypt/JWT para proteger as credenciais.
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { inserirUsuario, buscarPorEmail } = require('../dados/usuarios');
const { ErroHttp } = require('../middleware/erros');

/**
 * Valida e normaliza os dados de criacao de conta.
 * @param {unknown} corpo JSON recebido pelo servidor.
 * @returns {{nome:string,email:string,senha:string}} Dados limpos.
 * @throws {ErroHttp} 400 quando os campos nao satisfazem as restricoes.
 */
function validarCadastro(corpo) {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
    throw new ErroHttp(400, 'Informe os dados do cadastro.');
  }
  const { nome, email, senha } = corpo;
  if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 100) {
    throw new ErroHttp(400, 'Nome deve ter entre 2 e 100 caracteres.');
  }
  const emailNormalizado = validarEmail(email);
  // bcrypt considera somente os primeiros 72 bytes; rejeitamos senha maior para nao truncar.
  if (typeof senha !== 'string' || senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) {
    throw new ErroHttp(400, 'Senha deve ter no minimo 8 caracteres e no maximo 72 bytes.');
  }
  return { nome: nome.trim(), email: emailNormalizado, senha };
}

/**
 * Normaliza e valida email sem permitir entradas excessivamente longas.
 * @param {unknown} email Valor do formulario.
 * @returns {string} Email em minusculas.
 * @throws {ErroHttp} 400 para valor invalido.
 */
function validarEmail(email) {
  if (typeof email !== 'string') throw new ErroHttp(400, 'Email invalido.');
  const normalizado = email.trim().toLowerCase();
  if (normalizado.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado)) {
    throw new ErroHttp(400, 'Email invalido.');
  }
  return normalizado;
}

/**
 * Cria um usuario comum. Mesmo que o cliente envie papel=administrador, ele e ignorado.
 * @param {unknown} corpo JSON do cadastro.
 * @returns {Promise<{id:number,nome:string,email:string,papel:string}>} Usuario sem hash de senha.
 * @throws {ErroHttp} 400 para validacao; 409 para email repetido.
 */
async function cadastrar(corpo) {
  const { nome, email, senha } = validarCadastro(corpo);
  const senhaHash = await bcrypt.hash(senha, 12);
  try {
    return inserirUsuario({ nome, email, senhaHash });
  } catch (erro) {
    if (erro.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      // A UNIQUE no banco continua garantindo unicidade sob cadastros simultaneos.
      throw new ErroHttp(409, 'Ja existe uma conta com este email.');
    }
    throw erro;
  }
}

/**
 * Autentica credenciais e devolve token JWT assinado e dados publicos do usuario.
 * @param {unknown} corpo JSON do login.
 * @returns {Promise<{token:string,usuario:{id:number,nome:string,email:string,papel:string}}>} Sessao.
 * @throws {ErroHttp} 400 para formato invalido; 401 para credenciais incorretas.
 */
async function entrar(corpo) {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
    throw new ErroHttp(400, 'Informe email e senha.');
  }
  const email = validarEmail(corpo.email);
  if (typeof corpo.senha !== 'string' || !corpo.senha || corpo.senha.length > 256) {
    throw new ErroHttp(400, 'Informe uma senha valida.');
  }
  const conta = buscarPorEmail(email);
  if (!conta || !(await bcrypt.compare(corpo.senha, conta.senha_hash))) {
    // Nao distinguimos usuario inexistente de senha errada para nao expor cadastros.
    throw new ErroHttp(401, 'Email ou senha incorretos.');
  }
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(conta.id), algorithm: 'HS256', expiresIn: '2h',
    issuer: 'findit', audience: 'findit-web'
  });
  return {
    token,
    usuario: { id: conta.id, nome: conta.nome, email: conta.email, papel: conta.papel }
  };
}

module.exports = { cadastrar, entrar };
