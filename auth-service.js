var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const { user } = require("pg/lib/defaults");


var userSchema = new Schema({
    "userName": {type: String, unique: true},
    "password": String,
    "email": String,
    "loginHistory": [{"dateTime":Date, "userAgent":String}]
});

let User; // to be defined on new connection (see initialize)

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://rkumar:rkumar13@senecaweb.9ectole.mongodb.net/Web-322_Database?retryWrites=true&w=majority");

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};


module.exports.registerUser = function(userData) {
    return new Promise((resolve, reject)=>{
        if(userData.password != userData.password2){
            reject("Passwords do not match");
        }
        else{

            bcrypt.hash(userData.password, 10).then(hash=>{
                userData.password = hash;
                let newUser = new User(userData);
                newUser.save((err)=>{
                    if(err){
                        if(err.code === 11000)
                        reject("User name already taken " + err);
                        else 
                        reject("There was an error creating the user: err" + err);
                    }
                    else
                    resolve();
                });
            }).catch(err=>{
                reject("There was an error encrypting the password " + err);
            })

        }
    })
}

module.exports.checkUser = function(userData){
    return new Promise((resolve, reject) =>{
        User.find({userName: userData.userName}).exec().then((users)=>{
            if(!users){
                reject("Unable to find user: " + userData.userName);
            }
           
bcrypt.compare(userData.password, users[0].password).then((result)=>{
if(result === true){
    console.log("History before " + users[0].loginHistory);
    users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
    console.log("History after " + users[0].loginHistory);

    User.update({userName: users[0].userName},
        {$set: {loginHistory: users[0].loginHistory}})
        .exec()
        .then(()=>{
            resolve(users[0]);
        }).catch((err)=>{
            reject("There was an error verifying the user: err " + err);
        });

}
}).catch((err)=>{
    reject("Incorrect Password for user: userName " + userName);
})
        }).catch((err)=>{
            reject("Unable to find user: " + userData.userName)
        })
    })
}
