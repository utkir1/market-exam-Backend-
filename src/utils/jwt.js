import jwt from 'jsonwebtoken'

const sign = payload => jwt.sign(payload, process.env.SECRET_KEY, {
  expiresIn: '2d'
})

const verify = token => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.SECRET_KEY, (err, decode) => {
      if(err instanceof jwt.TokenExpiredError) {
        return  reject(JSON.stringify({
          message : "Expired token"
        }, null, 4))
      }

      if(err instanceof jwt.JsonWebTokenError) {
        return reject(JSON.stringify({
          message : "Invalid token"
        }, null, 4))
      }

      resolve(decode)
    })
  })
}

export {
  sign,
  verify
}