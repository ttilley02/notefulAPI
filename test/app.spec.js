const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeNotesArray } = require('./notes.fixtures');
const { makeFoldersArray } = require('./folder.fixtures');

describe('notes Endpoints', function() {
    let db;
  
    before('make knex instance', () => {
      db = knex({
        client: 'pg',
        connection: process.env.TEST_DATABASE_URL,
      });
      app.set('db', db);
    });
  
    after('disconnect from db', () => db.destroy());
  
    before('clean the table', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    afterEach('cleanup',() => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    
  describe('GET /api/notes TEST', () =>{
      context(`Given no notes`, () => {
          console.log(process.env.API_TOKEN)
          it(`responds with 200 and an empty list`, () => {
              return supertest(app)
              .get('/api/notes')
              .expect(200, []);
          });
          });
      context('Given there are notes in the database', () => {
          const testnotes =  makeNotesArray();
          const testfolders = makeFoldersArray();
              
          beforeEach('insert notes', () => {
            return db
            .into('noteful_folders')
            .insert(testfolders)
            .then(()=>{
              return db
              .into('noteful_notes')
              .insert(testnotes);
            })
          });

          it('GET /api/notes responds with 200 and all of the notes', () => {
                  return supertest(app)
                  .get('/api/notes')
                 
                  .expect(200, testnotes);
          });
      });
  });
      
      describe('GET /api/notes by ids', () =>{
          context(`Given no notes`, () => {
                   it(`responds with 404`, () => {
                     const noteId = 123456
                     return supertest(app)
                       .get(`/api/notes/${noteId}`)
                      
                       .expect(404, { error: { message: `note doesn't exist` } });
                   });
                 });
      context('Given there are notes in the database', () => {
        const testfolders = makeFoldersArray(); 
        const testnotes =  makeNotesArray();
      
              
          beforeEach('insert notes', () => {
            return db
            .into('noteful_folders')
            .insert(testfolders)
            .then(()=>{
              return db
              .into('noteful_notes')
              .insert(testnotes);
            })
          });

      it('GET /api/notes/:note_id responds with 200 and the specified note', () => {
              const noteId = 4;
              const expectednote = testnotes[noteId - 1];
              return supertest(app)
              .get(`/api/notes/${noteId}`)
             
              .expect(200, expectednote);
              });
      });
  });
    context(`Given an XSS attack note`, () => {
      const maliciousnote = {
        id: 911,
        name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        content: 'www.badhackattempt.com',
        modified: '2100-05-22T16:28:32.615Z',
        folder_id: 5
        
      };
      const testfolders = makeFoldersArray(); 
      const testnotes =  makeNotesArray();

      beforeEach('insert notes', () => {
        return db
        .into('noteful_folders')
        .insert(testfolders)
        .then(()=>{
          return db
          .into('noteful_notes')
          .insert([maliciousnote]);
        })
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/notes/${maliciousnote.id}`)
         
          .expect(200)
          .expect(res => {
            expect(res.body.name).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
            expect(res.body.content).to.eql('www.badhackattempt.com')
          });
      });
    });
      describe(`POST /api/notes/`, () => {
        const testfolders = makeFoldersArray(); 
        beforeEach('insert notes', () => {
          return db
          .into('noteful_folders')
          .insert(testfolders)
        })
      it(`creates an note, responding with 201 and the new note`, function() {
          this.retries(3);
          const newnote = {
              name: 'Test new note',
              content: 'www.duckduckgo.com',
              folder_id: 6
          };
           return supertest(app)
             .post('/api/notes/')
             .send(newnote)
             .expect(201)
              .expect(res => {
                expect(res.body.name).to.eql(newnote.name);
                expect(res.body.content).to.eql(newnote.content);
                expect(res.body.folder_id).to.eql(newnote.folder_id);
                expect(res.body).to.have.property('id');
                expect(res.body).to.have.property('modified');
                expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
             })
             .then(postRes =>
              supertest(app)
                  .get(`/api/notes/${postRes.body.id}`)
                 
                  .expect(postRes.body)
              );
         });
       });
      const requiredFields = ['name', 'content']
       
          requiredFields.forEach(field => {
            const newnote = {
              name: 'Test new note',
              content: 'www.duckduckgo.com'

            }
       
            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
              delete newnote[field]
       
              return supertest(app)
                .post('/api/notes')
                .send(newnote)
               
                .expect(400, {
                  error: { message: `Missing '${field}' in request body` }
                });
            });
          });
      describe(`DELETE /api/notes/:id`, () => {
        context(`Given no notes`, () => {
                  it(`responds with 404`, () => {
                    const noteId = 123456
                    return supertest(app)
                      .delete(`/api/notes/${noteId}`)
                     
                      .expect(404, { error: { message: `note doesn't exist` } })
                  })
                })
            context('Given there are notes in the database', () => {
              const testnotes = makeNotesArray();
              const testfolders = makeFoldersArray();
        
              beforeEach('insert notes', () => {
                return db
                .into('noteful_folders')
                .insert(testfolders)
                .then(()=>{
                  return db
                  .into('noteful_notes')
                  .insert(testnotes);
                })
              });
        
              it('responds with 204 and removes the note', () => {
                const idToRemove = 3
                const expectednotes = testnotes.filter(note => note.id !== idToRemove)
                return supertest(app)
                  .delete(`/api/notes/${idToRemove}`)
                 
                  .expect(204)
                  .then(res =>
                    supertest(app)
                      .get(`/api/notes`)
                     
                      .expect(expectednotes)
                  )
              })
            })
        })
      describe(`PATCH /api/notes/:id`, ()=>{
        context(`Given no notes`, ()=>{
          it(`responds with a 404`, ()=>{ 
            const noteId = 123456
            return supertest(app)
              .patch(`/api/notes/${noteId}`)
             
              .expect(404, { error: {message: `note doesn't exist`}})
          })
  
        })
        context('Given there are notes in the database', () => {
                const testnotes = makeNotesArray();
                const testfolders = makeFoldersArray();
          
                beforeEach('insert notes', () => {
                  return db
                  .into('noteful_folders')
                  .insert(testfolders)
                  .then(()=>{
                    return db
                    .into('noteful_notes')
                    .insert(testnotes);
                  })
                });
          
                it('responds with 204 and updates the note', () => {
                  const idToUpdate = 2
                  const updatenote = {
                    name: 'updated note name',
                    content: 'This contetn is about the old reddit.....www.old.reddit.com'
                  }
                  const expectednote = {
                        ...testnotes[idToUpdate - 1],
                        ...updatenote
                      }
                  return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send(updatenote)
                   
                    .expect(204)
                    .then(res =>
                    supertest(app)
                      .get(`/api/notes/${idToUpdate}`)
                     
                      .expect(expectednote)
                  )
                })
                it(`responds with 400 when no required fields supplied`, () => {
                      const idToUpdate = 2
                      return supertest(app)
                        .patch(`/api/notes/${idToUpdate}`)
                        .send({ irrelevantField: 'foo' })
                       
                        .expect(400, {
                          error: {
                            message: `Request body must contain either 'name' and 'content'`
                      }
                    })
                })
              it(`responds with 204 when updating only a subset of fields`, () => {
                      const idToUpdate = 2
                      const updatenote = {
                        content: 'updated note content',
                      }
                      const expectednote = {
                        ...testnotes[idToUpdate - 1],
                        ...updatenote
                      }
                
                      return supertest(app)
                        .patch(`/api/notes/${idToUpdate}`)
                        .send({
                          ...updatenote,
                          fieldToIgnore: 'should not be in GET response'
                        })
                       
                        .expect(204)
                        .then(res =>
                          supertest(app)
                            .get(`/api/notes/${idToUpdate}`)
                           
                            .expect(expectednote)
                        )
                    })
                  })
              })
    
  });