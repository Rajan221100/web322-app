/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part of this
*  assignment has been copied manually or electronically from any other source (including web sites) or 
*  distributed to other students.
* 
*  Name: __Rajan Kumar____________________ Student ID: __123072217____________ Date: __23 july 2022______________
*
*  Heroku App URL: https://pacific-fjord-31033.herokuapp.com/blog
*  GitHub Repository URL: https://github.com/Rajan221100/web322-app.git
*
********************************************************************************/ 
var express = require("express");
var app = express();
var path = require("path"); // use whenever want to send a file
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const data = require("./blog-service.js");
const exphbs = require("express-handlebars");
const stripJs = require("strip-js");
const upload = multer();

var HTTP_PORT = process.env.PORT || 8080;

app.engine(
    ".hbs",
    exphbs.engine({
        extname: ".hbs",
        helpers: {
            navLink: function(url, options) {
                return (
                    "<li" +
                    (url == app.locals.activeRoute ? ' class="active" ' : "") +
                    '><a href="' +
                    url +
                    '">' +
                    options.fn(this) +
                    "</a></li>"
                );
            },
            equal: function(lvalue, rvalue, options) {
                if (arguments.length < 3)
                    throw new Error("Handlebars Helper equal needs 2 parameters");
                if (lvalue != rvalue) {
                    return options.inverse(this);
                } else {
                    return options.fn(this);
                }
            },
            safeHTML: function(context) {
                return stripJs(context);
            },
            formatDate: function(dateObj) {
                let year = dateObj.getFullYear();
                let month = (dateObj.getMonth() + 1).toString();
                let day = dateObj.getDate().toString();
                return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            },
        },
    })
);
app.set("view engine", ".hbs");

function onHTTPStart() {
    console.log("Listening on: " + HTTP_PORT);
}

app.use(express.static("static"));
app.use(express.urlencoded({ extended: true }));

// set cloudinary
cloudinary.config({
    cloud_name: "di9ensrul",
    api_key: "816515555729951",
    api_secret: "s2Cy-EKqLqqQeGzcjw0yC3jex80",
    secure: true,
});

app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute =
        "/" +
        (isNaN(route.split("/")[1]) ?
            route.replace(/\/(?!.*)/, "") :
            route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

// home page
app.get("/", function(req, res) {
    res.redirect("/blog");
});

// about page
app.get("/about", function(req, res) {
    res.render(path.join(__dirname, "/views/about.hbs"));
});

// blog data - pulished posts

app.get("/blog", async(req, res) => {
    // Declare an object to store properties for the view
    let viewData = {};

    try {
        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await data.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await data.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0];

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await data.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", { data: viewData });
});

app.get("/blog/:id", async(req, res) => {
    // Declare an object to store properties for the view
    let viewData = {};

    try {
        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await data.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await data.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the post by "id"
        viewData.post = await data.getPostById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await data.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", { data: viewData });
});

app.get("/posts", (req, res) => {
    try {
        if (req.query.category) {
            data.getPostsByCategory(req.query.category).then((data) => {
                res.render("posts", { posts: data });
            });
        } else if (req.query.minDate) {
            data.getPostsByMinDate(req.query.minDate).then((data) => {
                res.render("posts", { posts: data });
            });
        } else {
            data.getAllPosts().then((data) => {
                if (data.length > 0) {
                    res.render("posts", { posts: data });
                } else {
                    {
                        res.render("posts", { message: "no results" });
                    }
                }
            });
        }
    } catch (err) {
        res.render("posts", { message: "no results" });
    }
});

app.get("/post/:id", function(req, res) {
    try {
        data.getPostById(req.params.id).then((data) => {
            res.render("posts", { posts: data });
        });
    } catch (err) {
        res.render("posts", { message: "no results" });
    }
});

// all categories
app.get("/categories", (req, res) => {

    data.getCategories().then((data) => {

            res.render("categories", { categories: data });

        })
        .catch((err) => {
            res.render("categories", { message: "no results" });
        });
});

app.get("/posts/add", (req, res) => {
    data
        .getCategories()
        .then((data) => {
            res.render("addPost.hbs", { categories: data });
        })
        .catch((err) => {
            res.render("addPost.hbs", { categories: [] });
        });
});

app.post("/posts/add", upload.single("featureImage"), (req, res) => {
    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream((error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            });

            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };

    async function upload(req) {
        let result = await streamUpload(req);
        console.log(result);
        return result;
    }

    upload(req).then((uploaded) => {
        req.body.featureImage = uploaded.url;

        // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts
        data.addPost(req.body).then(() => {
            res.redirect("/posts");
        });
    });
});

app.get("/categories/add", (req, res) => {
    res.render(path.join(__dirname, "views/addCategory.hbs"));
});

app.post("/categories/add", (req, res) => {
    data.addCategory(req.body).then(() => {
        res.redirect("/categories");
    });
});

app.get("/categories/delete/:id", (req, res) => {
    data
        .deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect("/categories");
        })
        .catch(function(err) {
            res.status(500).send("Unable to Remove Category / Category not found");
        });
});

app.get("/posts/delete/:id", (req, res) => {
    data
        .deletepostById(req.params.id)
        .then(() => {
            res.redirect("/posts");
        })
        .catch(function(err) {
            res.status(500).send("Unable to Remove post / post not found");
        });
});

// 404 - not found
app.use((req, res) => {
    res.status(404).render("404.hbs");
});

//app.listen(HTTP_PORT, onHTTPStart);
data
    .initialize()
    .then(function() {
        app.listen(HTTP_PORT, onHTTPStart);
    })
    .catch(function(err) {
        console.log("Unable to start the server: " + err);
    });