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

const authData = require("./auth-service.js");
const clientSessions = require("client-sessions");

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

app.use(
    clientSessions({
        cookieName: "session",
        secret: "web-assignment6",
        duration: 2 * 60 * 1000,
        activeDuration: 1000 * 60,
    })
);

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

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

app.get("/posts", ensureLogin, (req, res) => {
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

app.get("/post/:id", ensureLogin, function(req, res) {
    try {
        data.getPostById(req.params.id).then((data) => {
            res.render("posts", { posts: data });
        });
    } catch (err) {
        res.render("posts", { message: "no results" });
    }
});

// all categories
app.get("/categories", ensureLogin, (req, res) => {
    try {
        data.getCategories().then((data) => {
            if (data > 0) {
                res.render("categories", { categories: data });
            } else {
                res.render("categories", { message: "no results" });
            }
        });
    } catch (err) {
        res.render("categories", { message: "no results" });
    }
});

app.get("/posts/add", ensureLogin, (req, res) => {
    data
        .getCategories()
        .then((data) => {
            res.render("addPost.hbs", { categories: data });
        })
        .catch((err) => {
            res.render("addPost.hbs", { categories: [] });
        });
});

app.post(
    "/posts/add",
    ensureLogin,
    upload.single("featureImage"),
    (req, res) => {
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
    }
);

app.get("/categories/add", ensureLogin, (req, res) => {
    res.render(path.join(__dirname, "views/addCategory.hbs"));
});

app.post("/categories/add", ensureLogin, (req, res) => {
    data.addCategory(req.body).then(() => {
        res.redirect("/categories");
    });
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
    data
        .deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect("/categories");
        })
        .catch(function(err) {
            res.status(500).send("Unable to Remove Category / Category not found");
        });
});

app.get("/posts/delete/:id", ensureLogin, (req, res) => {
    data
        .deletepostById(req.params.id)
        .then(() => {
            res.redirect("/posts");
        })
        .catch(function(err) {
            res.status(500).send("Unable to Remove post / post not found");
        });
});

app.get("/login", (req, res) => {
    res.render(path.join(__dirname, "/views/login.hbs"));
});

app.get("/register", (req, res) => {
    res.render(path.join(__dirname, "/views/register.hbs"));
});

app.post("/register", (req, res) => {
    authData
        .registerUser(req.body)
        .then(() => {
            res.render("register.hbs", {
                successMessage: "User created",
            });
        })
        .catch(function(err) {
            res.render("register.hbs", {
                errorMessage: err,
                userName: req.body.userName,
            });
        });
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent");
    authData
        .checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory,
            };

            res.redirect("/posts");
        })
        .catch(function(err) {
            res.render("login.hbs", {
                errorMessage: err,
                userName: req.body.userName,
            });
        });
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory.hbs");
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

// 404 - not found
app.use((req, res) => {
    res.status(404).render("404.hbs");
});

//app.listen(HTTP_PORT, onHTTPStart);
data
    .initialize()
    .then(authData.initialize)
    .then(function() {
        app.listen(HTTP_PORT, function() {
            console.log("app listening on: " + HTTP_PORT);
        });
    })
    .catch(function(err) {
        console.log("unable to start server: " + err);
    });