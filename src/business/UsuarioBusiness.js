import Usuario from '../models/Usuario.js'
import mongoose from '../database/index.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


export default class UsuarioBusiness{

  async index(){
    try{
      const Usuarios = await Usuario.find()
      return {Usuarios}
    }catch(error){
      console.log(error)
      error.message = "Error in database"
      throw error
    }
  }

  async show(params = {}) {
    try {
      let error
      const { _id } = params

      if (!_id) {
        error = { message: '_id não foi passado' }
        throw error
      }

      const response = await Usuario.findOne({_id})

      if (!response) {
        error = { message: '_id não existe!' }
        throw error
      }

      return { Usuario: response }
    } catch (error) {
      throw { error }
    }
  }


  async create(params = {}) {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      let error

      for (const [key, value] of Object.entries(params)) {
        if (value == null || value === undefined) {
          error = { message: `"${key}" não declarado!!` }
          throw error
        }
      }

      const { email, senha, roles} = params
      
      const exists = await Usuario.findOne({ email })

      if (exists) {
        err = { message: 'Usuario já existe!' }
        throw err
      }

      const senhaCriptografada = await bcrypt.hash(senha, 10)

      const novoUsuario = await Usuario.create({
         senha: senhaCriptografada,
         email,
         roles
      })

      const token = jwt.sign({ id: novoUsuario._id }, 'projetoluispw3', {
        expiresIn: 86400,
      })

      novoUsuario.token = token
      
      await novoUsuario.save()
      await session.commitTransaction()
      return { novoUsuario }
    } catch (error) {
      await session.abortTransaction()
      throw { error }
    } finally {
      session.endSession()
    }
  }

  async update(params = {}) {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const { usuario } = params
      const { _id } = usuario

      let error;

      if (!mongoose.mongo.ObjectId.isValid(_id)) {
        error = { message: '"_id" não é um id válido!' }
        throw error
      }

      const response = await Usuario.findByIdAndUpdate({ _id }, usuario)

      if (!response) {
        error = { message: 'usuario não existe' }
        throw error
      }

      await session.commitTransaction()

      const novoUsuario = await Usuario.findOne({_id})
      return { novoUsuario }
    } catch (error) {
      await session.abortTransaction()
      throw { error }
    } finally {
      session.endSession()
    }
  }


  async delete(params = {}){
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      let error = {}
      const { _id } = params

      if (!mongoose.mongo.ObjectId.isValid(_id)) {
        error = { message: '"_id" não é um id válido!' }
        throw error
      }
      const usuario = await Usuario.findByIdAndDelete(_id)

      if(!usuario){
        error = { message: 'Aluno não foi deletado!!' }
        throw error
      }
      await session.commitTransaction()

      return { deleted: true }
    } catch (error) {
      await session.abortTransaction()
      throw { error }
    } finally {
      session.endSession()
    }
  }

}