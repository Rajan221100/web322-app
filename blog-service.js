const Sequelize = require("sequelize");

var sequelize = new Sequelize('d44risnd7hu40i', 'jsdvglnhtnxbgs', 'b28de6817ec067d4ab19bd4587ed6d6df65540e0a99d05a4c7c24580ab8d545c', {
    host: 'ec2-3-225-110-188.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});


var Post = sequelize.define("Post", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
});

var Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

Post.belongsTo(Category, { foreignKey: "category" });

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve("Operation was a success");
      })
      .catch(() => {
        reject("unable to sync the database");
      });
  });
};

module.exports.getAllPosts = function () {
  return new Promise((resolve, reject) => {
    Post.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("no results returned");
      });
  });
};

module.exports.getPublishedPosts = function () {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true,
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("no results returned");
      });
  });
};

module.exports.getCategories = function () {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("no results returned");
      });
  });
};

module.exports.addPost = function (postData) {
  return new Promise((resolve, reject) => {
    postData.published = postData.published ? true : false;
    for (let i in postData) {
      if (postData[i] == "") {
        postData[i] = null;
      }
    }
    postData.postDate = new Date();
    Post.create(postData)
      .then(resolve())
      .catch(reject("unable to create post"));
  });
};

module.exports.getPostsByCategory = function (category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: { category: category },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("no results returned");
      });
  });
};

module.exports.getPostsByMinDate = function (minDateStr) {
  return new Promise((resolve, reject) => {
    const { gte } = Sequelize.Op;

    Post.findAll({
      where: {
        postDate: {
          [gte]: new Date(minDateStr),
        },
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("no results returned");
      });
  });
};

module.exports.getPostById = function (id) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        id: id,
      },
    })
      .then((data) => {
        resolve(data[0]);
      })
      .catch(() => {
        reject("no results returned");
      });
  });
};

module.exports.getPublishedPostsByCategory = function (category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true,
        category: category,
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("no results returned");
      });
  });
};

module.exports.addCategory = function (categoryData) {
  return new Promise((resolve, reject) => {
    for (var i in categoryData) {
      if (categoryData[i] == "") {categoryData[i] = null};
    }
    Category.create(categoryData)
      .then(resolve())
      .catch(reject("unable to create category"));
  });
};

module.exports.deleteCategoryById = function (id) {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: { id: id },
    })
      .then(resolve("Category was deleted"))
      .catch(reject("Destroy method encountered an error"));
  });
};

module.exports.deletePostById = function (id) {
  return new Promise((resolve, reject) => {
    Post.destroy({
      where: { id: id },
    })
      .then(resolve("Post was deleted"))
      .catch(reject("Destroy method encountered an error"));
  });
};
