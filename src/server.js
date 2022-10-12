import http from 'http'
import { read, write} from './utils/FS.js'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { sign, verify } from './utils/jwt.js'

dotenv.config()

const options = {
  'content-type' : 'application/json'
}

const server =  http.createServer((req, res) => {
  if(req.method == 'GET') {

    const url = req.url.split('/')[1]
    const urlId = req.url.split('/')[2]

    if(url == 'markets' && urlId) {
      const { access_token } = req.headers

      if(!access_token) {
        res.writeHead(400, options)
        res.end(JSON.stringify({
          message : "Provide access token"
        }))
      }

      verify(access_token).then(() => {

        const allMarkets = read('markets.json')
        const allBranches = read('branches.json')
        const allWorkers = read('workers.json')
        const allProducts = read('products.json')

              //marketni id boyicha topib olish
        const foundMarkets = allMarkets.find(e => e.id == urlId)


              //Marketga tegishli branchlarni topib filterlash
        const foundBranches = allBranches.filter(e => e.marketId == urlId).filter(e => delete e.marketId)


              //workerlarni tegishli  branchlarga map qilish
        const foundWorkers = foundBranches.map(j => (allWorkers.filter(e => foundBranches.find(m => e.branchId == m.id))) ?
         j.workers = (allWorkers.filter(e => foundBranches.find(m => e.branchId == m.id)))
         .filter(n => j.id == n.branchId)
         .filter(g => delete g.branchId) : null)


              //Productlarni tegishli  branchlarga map qilish
        const foundProducts = foundBranches.map(j => (allProducts.filter(e => foundBranches.find(m => e.branchId == m.id))) ?
        j.products = (allProducts.filter(e => foundBranches.find(m => e.branchId == m.id)))
        .filter(n => j.id == n.branchId)
        .filter(g => delete g.branchId) : null)


             //marketlarga tegishli branchlarini qo'shib qo'yish
        foundMarkets.branches = foundBranches


        if(!foundMarkets) {
          res.writeHead(404, options)
          return res.end(JSON.stringify({
            message : "No market"
          }))
        }

        res.writeHead(200, options)
        res.end(JSON.stringify(foundMarkets))

      })
      .catch(err => {
        res.writeHead(401, options)
        res.end(err)
      })


    }

    if(url == 'branches' && urlId) {
      const { access_token } = req.headers

      if(!access_token) {
        res.writeHead(400, options)
        res.end(JSON.stringify({
          message : "Provide access token"
        }))
      }

      verify(access_token).then(() => {

        const allBranches = read('branches.json')
        const allWorkers = read('workers.json')
        const allProducts = read('products.json')

              //Branchnni id boyicha topib olish
        const foundBranches = allBranches.find(e => e.id == urlId)
        delete foundBranches.marketId

              //Branchga tegishli workerlarni  filterlash
        const foundWorkers = allWorkers.filter(e => e.branchId == urlId).filter(e => delete e.branchId)

              //Branchga tegishli productlarni  filterlash
        const foundProducts = allProducts.filter(e => e.branchId == urlId).filter(e => delete e.branchId)

             //branchlarga tegishli worker va productlarni qo'shib qo'yish
        foundBranches.workers = foundWorkers
        foundBranches.products = foundProducts

        if(!foundBranches) {
          res.writeHead(404, options)
          return res.end(JSON.stringify({
            message : "No market"
          }))
        }

        res.writeHead(200, options)
        res.end(JSON.stringify(foundBranches))

      })
      .catch(err => {
        res.writeHead(401, options)
        res.end(err)
      })
    }

    if(req.url == '/markets') {
      const { access_token } = req.headers

      if(!access_token) {
        res.writeHead(400, options)
        res.end(JSON.stringify({
          message : "Provide access token"
        }))
      }

      verify(access_token).then(() => {

        const allMarkets = read('markets.json')

        if(!allMarkets.length) {
          res.writeHead(404, options)
          return res.end(JSON.stringify({
            message : "No markets, create one"
          }))
        }

        res.writeHead(200, options)
        res.end(JSON.stringify({
          message: "Markets",
          data: allMarkets
        }))

      })
      .catch(err => {
        res.writeHead(401, options)
        res.end(err)
      })

    }

    return
  }

  if(req.method == 'POST') {

    if(req.url == '/login') {
      req.on('data', chunk => {
        const { name, password } = JSON.parse(chunk)

        const foundUser = read('users.json').find(e => e.name == name && e.password == password)

        if(!foundUser) {
          res.writeHead(401, options)
          return res.end(JSON.stringify({
            message : "UNathorized"
          }))
        }

        res.writeHead(200 ,options)
        return res.end(JSON.stringify({
          message : "Successfully logged in",
          access_token : sign({id: foundUser?.id})
        }))

      })
    }

    if(req.url == '/markets') {
      req.on('data', chunk => {
        const { title } = JSON.parse(chunk)
        const { access_token } = req.headers

        jwt.verify(access_token, process.env.SECRET_KEY, async (err, decode) => {
          if(err instanceof jwt.TokenExpiredError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Expired token"
            }))
          }
          if(err instanceof jwt.JsonWebTokenError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Invalid token"
            }))
          }

          const allMarkets = read('markets.json')

          allMarkets.push({ id: allMarkets.at(-1)?.id + 1 || 1 , title})

          const newMarket = await write('markets.json', allMarkets)

          if(newMarket) {
            res.writeHead(201, options)
            return res.end(JSON.stringify({
              message : "Market has been created"
            }))
          }

        })

      })
    }

    if(req.url == '/branches') {
      req.on('data', chunk => {
        const { title, address, marketId } = JSON.parse(chunk)

        const { access_token } = req.headers

        jwt.verify(access_token, process.env.SECRET_KEY, async (err, decode) => {
          if(err instanceof jwt.TokenExpiredError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Expired token"
            }))
          }

          if(err instanceof jwt.JsonWebTokenError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Invalid token"
            }))
          }

          const allBranches = read('branches.json')

          allBranches.push({ id: allBranches.at(-1)?.id + 1 || 1 , title, address, marketId})

          const newBranch = await write('branches.json', allBranches)


          if(newBranch) {
            res.writeHead(201, options)
            return res.end(JSON.stringify({
              message : "Branch has been created"
            }))
          }

        })

      })

    }

    if(req.url == '/workers') {
      req.on('data', chunk => {
        const { name, phoneNumber, branchId } = JSON.parse(chunk)

        const { access_token } = req.headers

        jwt.verify(access_token, process.env.SECRET_KEY, async (err, decode) => {
          if(err instanceof jwt.TokenExpiredError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Expired token"
            }))
          }

          if(err instanceof jwt.JsonWebTokenError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Invalid token"
            }))
          }

          const allWorkers = read('workers.json')

          allWorkers.push({ id: allWorkers.at(-1)?.id + 1 || 1 , name, phoneNumber, branchId})

          const newWorker = await write('workers.json', allWorkers)


          if(newWorker) {
            res.writeHead(201, options)
            return res.end(JSON.stringify({
              message : "Worker has been created"
            }))
          }

        })

      })

    }

    if(req.url == '/products') {
      req.on('data', chunk => {
        const { title, price, branchId } = JSON.parse(chunk)

        const { access_token } = req.headers

        jwt.verify(access_token, process.env.SECRET_KEY, async (err, decode) => {
          if(err instanceof jwt.TokenExpiredError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Expired token"
            }))
          }

          if(err instanceof jwt.JsonWebTokenError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Invalid token"
            }))
          }

          const allProducts = read('products.json')

          allProducts.push({ id: allProducts.at(-1)?.id + 1 || 1 , title, price, branchId})

          const newProduct = await write('products.json', allProducts)


          if(newProduct) {
            res.writeHead(201, options)
             return res.end(JSON.stringify({
              message : "Product has been created"
            }))
          }

        })

      })

    }

    return
  }

  if(req.method == 'PUT') {

    const url = req.url.split('/')[1]
    const urlId = req.url.split('/')[2]

    if(url == 'markets' && urlId) {
      req.on('data', chunk => {
        const { title } = JSON.parse(chunk)
        const { access_token } = req.headers

        jwt.verify(access_token, process.env.SECRET_KEY, async (err, decode) => {
          if(err instanceof jwt.TokenExpiredError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Expired token"
            }))
          }
          if(err instanceof jwt.JsonWebTokenError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Invalid token"
            }))
          }

          const allMarkets = read('markets.json')

          const foundMarkets = allMarkets.find(e => e.id == urlId)

          foundMarkets.title = title || foundMarkets.title

          const updated = await write('markets.json', allMarkets)

          if(updated) {
            res.writeHead(201, options)
            res.end(JSON.stringify({
              message : "Market is successfully updated"
            }))
          }

        })

      })

    }

    if(url == 'branches' && urlId) {

      req.on('data', chunk => {
        const { title, address, marketId } = JSON.parse(chunk)
        const { access_token } = req.headers

        jwt.verify(access_token, process.env.SECRET_KEY, async (err, decode) => {
          if(err instanceof jwt.TokenExpiredError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Expired token"
            }))
          }
          if(err instanceof jwt.JsonWebTokenError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Invalid token"
            }))
          }

          const allBranches = read('branches.json')

          const foundBranches = allBranches.find(e => e.id == urlId)

          foundBranches.title = title || foundBranches.title
          foundBranches.address = address || foundBranches.address
          foundBranches.marketId = marketId || foundBranches.marketId

          const updated = await write('branches.json', allBranches)

          if(updated) {
            res.writeHead(201, options)
            res.end(JSON.stringify({
              message : "Branch is successfully updated"
            }))
          }

        })

      })

    }

    if(url == 'workers' && urlId) {

      req.on('data', chunk => {
        const { name, phoneNumber, branchId } = JSON.parse(chunk)
        const { access_token } = req.headers

        jwt.verify(access_token, process.env.SECRET_KEY, async (err, decode) => {
          if(err instanceof jwt.TokenExpiredError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Expired token"
            }))
          }
          if(err instanceof jwt.JsonWebTokenError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Invalid token"
            }))
          }

          const allWorkers = read('workers.json')

          const foundWorkers = allWorkers.find(e => e.id == urlId)

          foundWorkers.name = name || foundWorkers.name
          foundWorkers.phoneNumber = phoneNumber || foundWorkers.phoneNumber
          foundWorkers.branchId = branchId || foundWorkers.branchId

          const updated = await write('workers.json', allWorkers)

          if(updated) {
            res.writeHead(201, options)
            res.end(JSON.stringify({
              message : "Worker is successfully updated"
            }))
          }

        })

      })

    }

    if(url == 'products' && urlId) {

      req.on('data', chunk => {
        const { title, price, branchId } = JSON.parse(chunk)
        const { access_token } = req.headers

        jwt.verify(access_token, process.env.SECRET_KEY, async (err, decode) => {
          if(err instanceof jwt.TokenExpiredError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Expired token"
            }))
          }
          if(err instanceof jwt.JsonWebTokenError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Invalid token"
            }))
          }

          const allProducts = read('products.json')

          const foundProducts = allProducts.find(e => e.id == urlId)

          foundProducts.title = title || foundProducts.title
          foundProducts.price = price || foundProducts.price
          foundProducts.branchId = branchId || foundProducts.branchId

          const updated = await write('products.json', allProducts)

          if(updated) {
            res.writeHead(201, options)
            res.end(JSON.stringify({
              message : "Product is succesfully updated"
            }))
          }

        })

      })

    }

    return
  }

  if(req.method == 'DELETE') {

    const url = req.url.split('/')[1]
    const urlId = req.url.split('/')[2]

    if(url == 'markets' && urlId) {
        const { access_token } = req.headers

        jwt.verify(access_token, process.env.SECRET_KEY, async (err, decode) => {
          if(err instanceof jwt.TokenExpiredError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Expired token"
            }))
          }
          if(err instanceof jwt.JsonWebTokenError) {
            res.writeHead(401, options)
            return res.end(JSON.stringify({
              message : "Invalid token"
            }))
          }

          const allMarkets = read('markets.json')

          const index = allMarkets.findIndex(e => e.id == urlId)

          allMarkets.splice(index, 1)

          const deleted = await write('markets.json', allMarkets)

          if(deleted) {
            res.writeHead(200, options)
            return res.end(JSON.stringify({
              message : "Market is successfully deleted"
            }))
          }

        })



    }

    if(url == 'branches' && urlId) {
      const { access_token } = req.headers

      jwt.verify(access_token, process.env.SECRET_KEY, async (err, decode) => {
        if(err instanceof jwt.TokenExpiredError) {
          res.writeHead(401, options)
          return res.end(JSON.stringify({
            message : "Expired token"
          }))
        }
        if(err instanceof jwt.JsonWebTokenError) {
          res.writeHead(401, options)
          return res.end(JSON.stringify({
            message : "Invalid token"
          }))
        }

        const allBranches = read('branches.json')

        const index = allBranches.findIndex(e => e.id == urlId)

        allBranches.splice(index, 1)

        const deleted = await write('branches.json', allBranches)

        if(deleted) {
          res.writeHead(200, options)
          return res.end(JSON.stringify({
            message : "Branch is successfully deleted"
          }))
        }

      })



    }

    if(url == 'workers' && urlId) {
      const { access_token } = req.headers

      jwt.verify(access_token, process.env.SECRET_KEY, async (err, decode) => {
        if(err instanceof jwt.TokenExpiredError) {
          res.writeHead(401, options)
          return res.end(JSON.stringify({
            message : "Expired token"
          }))
        }
        if(err instanceof jwt.JsonWebTokenError) {
          res.writeHead(401, options)
          return res.end(JSON.stringify({
            message : "Invalid token"
          }))
        }

        const allWorkers = read('workers.json')

        const index = allWorkers.findIndex(e => e.id == urlId)

        allWorkers.splice(index, 1)

        const deleted = await write('workers.json', allWorkers)

        if(deleted) {
          res.writeHead(200, options)
          return res.end(JSON.stringify({
            message : "Worker is successfully deleted"
          }))
        }

      })



    }

    if(url == 'products' && urlId) {
      const { access_token } = req.headers

      jwt.verify(access_token, process.env.SECRET_KEY, async (err, decode) => {
        if(err instanceof jwt.TokenExpiredError) {
          res.writeHead(401, options)
          return res.end(JSON.stringify({
            message : "Expired token"
          }))
        }
        if(err instanceof jwt.JsonWebTokenError) {
          res.writeHead(401, options)
          return res.end(JSON.stringify({
            message : "Invalid token"
          }))
        }

        const allProducts = read('products.json')

        const index = allProducts.findIndex(e => e.id == urlId)

        allProducts.splice(index, 1)

        const deleted = await write('products.json', allProducts)

        if(deleted) {
          res.writeHead(200, options)
          return res.end(JSON.stringify({
            message : "Product is successfully deleted"
          }))
        }

      })



    }

    return
  }

  res.writeHead(404, options)
  res.end(JSON.stringify({
    message : 'Not found'
  }))
})

server.listen(9000, console.log(9000))