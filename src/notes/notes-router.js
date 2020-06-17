const path = require('path')
const express = require('express');
const xss = require('xss');
const notesService = require('./notes-service');

const notesRouter = express.Router();
const jsonParser = express.json();

notesRouter
  .route('/api/notes')
  .get((req, res, next) => {
    notesService.getAllNotes(
      req.app.get('db')
    )
      .then(notes => {
        res.json(notes);
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { name, content, folder_id } = req.body
    const newNote = { name, content, folder_id}; 

    if (!name) {
           return res.status(400).json({
             error: { message: `Missing 'name' in request body` }
          });
         }
    if (!content) {
        return res.status(400).json({
          error: { message: `Missing 'content' in request body` }
        });
      }
    if (!content) {
      return res.status(400).json({
        error: { message: `Missing 'folder_id' in request body` }
      });
    }
    notesService.insertnote(
      req.app.get('db'),
      newNote
    )
    

      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(note);
      })
      .catch(next);
  });

  notesRouter
  .route('/api/notes/:note_id')
  .all((req, res, next) => {
         notesService.getById(
           req.app.get('db'),
           req.params.note_id
         )
           .then(note => {
             if (!note) {
               return res.status(404).json({
                 error: { message: `note doesn't exist` }
               })
             }
             res.note = note // save the note for the next middleware
             next() // don't forget to call next so the next middleware happens!
           })
           .catch(next)
       })
  .get((req, res, next) => {
    res.json({
      id: res.note.id,
      name: xss(res.note.name), // sanitize name
      content: xss(res.note.content), // sanitize content
      modified: res.note.modified,
      folder_id: res.note.folder_id
    });
  })
  .delete((req, res, next) => {
    notesService.deletenote(
           req.app.get('db'),
           req.params.note_id
         )
           .then(() => {
             res.status(204).end()
           })
           .catch(next)
    })
  .patch(jsonParser, (req, res, next) => {
        const { name, content} = req.body
        const noteToUpdate = { name, content}
        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
          if (numberOfValues === 0) {
            return res.status(400).json({
              error: {
                message: `Request body must contain either 'name' and 'content'`
              }
            })
          }
          
        notesService.updatenote(
          req.app.get('db'),
          req.params.note_id,
          noteToUpdate
        )
          .then(numRowsAffected => {
            res.status(204).end()
          })
          .catch(next)
    })



module.exports = notesRouter;