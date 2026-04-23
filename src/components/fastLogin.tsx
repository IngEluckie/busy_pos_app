import React, { FormEvent, useState } from 'react'
import { useSession } from '../context/SessionContext'
import './fastLogin.css'

export const FastLogin = () => {
  const { apiBaseUrl, login } = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(username.trim(), password)
    } catch (loginError) {
      if (loginError instanceof Error) {
        setError(loginError.message)
      } else {
        setError('No fue posible iniciar sesión.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className='fast-login' onSubmit={handleSubmit}>
      <label className='fast-login__field'>
        <span className='fast-login__label'>Usuario</span>
        <input
          autoComplete='username'
          autoFocus
          className='fast-login__input'
          disabled={isSubmitting}
          onChange={(event) => setUsername(event.target.value)}
          required
          type='text'
          value={username}
        />
      </label>

      <label className='fast-login__field'>
        <span className='fast-login__label'>Contraseña</span>
        <input
          autoComplete='current-password'
          className='fast-login__input'
          disabled={isSubmitting}
          onChange={(event) => setPassword(event.target.value)}
          required
          type='password'
          value={password}
        />
      </label>

      {error && (
        <p className='fast-login__error' role='alert'>
          {error}
        </p>
      )}

      <p className='fast-login__server'>API: {apiBaseUrl}</p>

      <button className='fast-login__button' disabled={isSubmitting} type='submit'>
        {isSubmitting ? 'Validando...' : 'Entrar'}
      </button>
    </form>
  )
}
