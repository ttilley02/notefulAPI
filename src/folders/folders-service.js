const foldersService = {
    getAllfolders(knex){
    return knex.select('*').from('noteful_folders');
    },

    insertfolder(knex, newfolder) {
    return knex
           .insert(newfolder)
           .into('noteful_folders')
           .returning('*')
           .then(rows => {
            return rows[0];
           });
    },

    getById(knex, id) {
          return knex.from('noteful_folders').select('*').where('id', id).first();
        },

    deletefolder(knex, id) {
       return knex('noteful_folders')
         .where({ id })
         .delete();
     },

    updatefolder(knex, id, newfolderFields) {
     return knex('noteful_folders')
       .where({ id })
       .update(newfolderFields);
    },
};

module.exports = foldersService;