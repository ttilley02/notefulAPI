const path = require('path')
const express = require('express');
const xss = require('xss');
const foldersService = require('./folders-service');

const foldersRouter = express.Router();
const jsonParser = express.json();

foldersRouter
  .route('/api/folders')
  .get((req, res, next) => {
    foldersService.getAllfolders(
      req.app.get('db')
    )
      .then(folders => {
        res.json(folders);
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { name, content, modified} = req.body
    const newfolder = { name, content, modified}; 

    if (!name) {
           return res.status(400).json({
             error: { message: `Missing 'title' in request body` }
          });
         }
    if (!content) {
        return res.status(400).json({
          error: { message: `Missing 'content' in request body` }
        });
      }
    newfolder.author = author
    foldersService.insertfolder(
      req.app.get('db'),
      newfolder
    )
    

      .then(folder => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${folder.id}`))
          .json(folder);
      })
      .catch(next);
  });

  foldersRouter
  .route('/api/folders/:folder_id')
  .all((req, res, next) => {
         foldersService.getById(
           req.app.get('db'),
           req.params.folder_id
         )
           .then(folder => {
             if (!folder) {
               return res.status(404).json({
                 error: { message: `folder doesn't exist` }
               })
             }
             res.folder = folder // save the folder for the next middleware
             next() // don't forget to call next so the next middleware happens!
           })
           .catch(next)
       })
  .get((req, res, next) => {
    res.json({
      id: res.folder.id,
      name: xss(res.folder.title), // sanitize title
      modified: res.folder.modified
    });
  })
  .delete((req, res, next) => {
    foldersService.deletefolder(
           req.app.get('db'),
           req.params.folder_id
         )
           .then(() => {
             res.status(204).end()
           })
           .catch(next)
    })
  .patch(jsonParser, (req, res, next) => {
        const { name} = req.body
        const folderToUpdate = { name}
        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
          if (numberOfValues === 0) {
            return res.status(400).json({
              error: {
                message: `Request body must a 'name'`
              }
            })
          }
          
        foldersService.updatefolder(
          req.app.get('db'),
          req.params.folder_id,
          folderToUpdate
        )
          .then(numRowsAffected => {
            res.status(204).end()
          })
          .catch(next)
    })



module.exports = foldersRouter;