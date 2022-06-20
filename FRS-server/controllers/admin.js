const db = require("../db/dbconnect");
const fs = require("fs");
const filterFiller = require("../utils/filter");
const uploadsFolder = "./../uploads/";
const  spawn  = require('child_process').spawn;

const adminLogin = async (req, res) => {
    const {username, password} = req.body;

    if(!username)
        return res.status(206).json({msg:"no username provided"});
    if(!password)
        return res.status(206).json({msg:"no password provided"});

    db.promise().query("SELECT password FROM admin WHERE username = ?", [username])
        .then(([result]) => {
            if(!result[0]) 
                res.status(404).json({msg:"user does not exist"});
            else {
                if(password === result[0].password)
                    res.status(200).json({msg:"login successful"});
                else
                    res.status(422).json({msg:"login unsuccessful"});
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({msg: err.sqlMessage});
        });
};

const createUser = async (req, res) => {
    const {name, mob_no, gender, city, department} = req.body;
    if(!name || !mob_no || !gender || !city || !department || !req.files || !req.files.base_img)
        return res.status(206).json({msg:"insufficient data provided"});
    if(req.files.base_img.mimetype !== "image/jpeg" && !req.files.base_img.data.toString().startsWith("data:image/jpeg;base64,"))
        return res.status(415).json({msg:"unsupported filetype"});

    // recognize face function call
    const recognize_face = spawn('python', ['./add_replace_face.py',req.files.base_img,name]);
    var face_detection="";
    process.stdout.on('data', function(data) {
        dataString = data.toString();
        dataArr = dataString.substring(1,dataString.length-1).split(",")
        face_detection = dataArr[0].split(":")[1];
    } )

    if(face_detection === "no_face")return res.status(415).json({msg:"no face detected"});
    if(face_detection === "multiple_faces")return res.status(415).json({msg:"multiple faces detected"});

    db.promise().query("INSERT INTO user (name, mob_no, gender, city, department) VALUE (?,?,?,?,?)",
    [name, mob_no, gender, city, department])
        .then(() => {
            db.execute("SELECT base_img FROM user WHERE mob_no = ?", [mob_no], 
            (err, result) => {
                if(req.files.base_img.mimetype === "image/jpeg") {
                    fs.writeFileSync(uploadsFolder+result[0].base_img+".jpeg", req.files.base_img.data);
                }  
                else {
                    var base64str = req.files.base_img.data.toString().replace("data:image/jpeg;base64,", "")
                    fs.writeFileSync(uploadsFolder+result[0].base_img+".jpeg", base64str, "base64");
                }
            });
            res.status(201).json({msg:"User Created Successfully"});
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({msg: err.sqlMessage});
        });
};

const getUser = async (req, res) => {
    const user_id = req.query.user_id;
    if(!user_id)
        return res.status(200).json({msg:"no user_id provided"});
    db.promise().query("SELECT * FROM user WHERE user_id = ?", [user_id])
        .then((result) => {
            if(!result[0][0]) 
                res.status(200).json({msg:"user does not exist"});
            else {
                result[0][0].date_created = String(result[0][0].date_created).substring(4,15);
                res.status(200).json(result[0][0]);
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({msg: err.sqlMessage});
        });
};

const getUsers = async (req, res) => {
    db.promise().query("SELECT * FROM user")
        .then((result) => {
            if(!result[0][0]) 
                res.status(200).json({msg:"no users in the db"});
            else {
                result[0].forEach((user) => {
                    user.date_created = String(user.date_created).substring(4,15);
                });
                res.status(200).json(result[0]);
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({msg: err.sqlMessage});
        });
};

const getSortedUsers = async (req, res) => {
    var {col_name, sort_order} = req.body;
    if(!col_name)
        return res.status(200).json({msg:"no col_name provided"});
    if(sort_order === "ascending")
        sort_order = "";
    else if(sort_order === "descending")
        sort_order = "DESC";
    else
        return res.status(200).json({msg:"invalid sort order request"});
    db.promise().query(`SELECT * FROM user ORDER BY ?? ${sort_order}`, [col_name])
        .then((result) => {
            if(!result[0][0]) 
                res.status(200).json({msg:"no users in the db"});
            else {
                result[0].forEach((user) => {
                    user.date_created = String(user.date_created).substring(4,15);
                });
                res.status(200).json(result[0]);
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({msg: err.sqlMessage});
        });
};

const getFilteredUsers = async (req, res) => {
    var {name, gender, city, department, date_created} = filterFiller(req.body);
    db.promise().query(`SELECT * FROM user WHERE name IN (${name}) AND gender IN (${gender}) AND city IN (${city}) AND department IN (${department}) AND date_created ${date_created}`)
        .then((result) => {
            if(!result[0][0])
                res.status(200).json({msg:"no users match the criteria"});
            else {
                result[0].forEach((user) => {
                    user.date_created = String(user.date_created).substring(4,15);
                });
                res.status(200).json(result[0]);
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({msg: err.sqlMessage});
        });
};

const updateUser = async (req, res) => {
    const user_id = req.query.user_id;
    if(!user_id)
        return res.status(200).json({msg:"no user_id provided"});
    if(req.files && req.files.base_img && req.files.base_img.mimetype !== "image/jpeg" && !req.files.base_img.data.toString().startsWith("data:image/jpeg;base64,"))
        return res.status(200).json({msg:"unsupported filetype"});
    // change face call
    const add_replace_face = spawn('python', ['./add_replace_face.py',req.files.base_img,name]);
    var face_detection="";
    process.stdout.on('data', function(data) {
        dataString = data.toString();
        dataArr = dataString.substring(1,dataString.length-1).split(",")
        face_detection = dataArr[0].split(":")[1];
    } )

    const {name, mob_no, gender, city, department} = req.body;
    const newImgLoc = uploadsFolder+name+"_"+String(user_id)+".jpeg";
    db.promise().query("SELECT base_img FROM user WHERE user_id = ?", [user_id])
        .then((result) => {
            db.promise().query("UPDATE user SET name = ?, mob_no = ?, gender = ?, city = ?, department = ? WHERE user_id = ?",
            [name, mob_no, gender, city, department, user_id])
                .then(() => {
                    fs.renameSync(uploadsFolder+result[0][0].base_img+".jpeg", newImgLoc);
                        if(req.files) {
                            if(req.files.base_img.mimetype === "image/jpeg") {                        
                                fs.writeFileSync(newImgLoc, req.files.base_img.data);
                            }  
                            else {
                                var base64str = req.files.base_img.data.toString().replace("data:image/jpeg;base64,", "")
                                fs.writeFileSync(newImgLoc, base64str, "base64");
                            }
                        }
                    res.status(200).json({msg:"User Updated Successfully"});
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).json({msg: err.sqlMessage});
                });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({msg: err.sqlMessage});
        });
};

const deleteUser = async (req, res) => {
    const user_id = req.query.user_id;
    if(!user_id)
        return res.status(200).json({msg:"no user_id provided"});
    db.promise().query("SELECT base_img FROM user WHERE user_id = ?", [user_id])
        .then((result) => {
            if(!result[0][0]) {
                res.status(200).json({msg:"user does not exist"});
            }
            else {
                db.execute("DELETE FROM user WHERE user_id = ?", [user_id], 
                    (err) => {
                        if(err){
                            console.log(err);
                            res.status(500).json({msg:"Something went wrong"});
                        }
                        else {
                            fs.unlinkSync(uploadsFolder+result[0][0].base_img+".jpeg");
                            res.status(200).json({msg:"User Deleted Successfully"});
                        }
                    }
                );
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({msg: err.sqlMessage});
        });      
};

module.exports = { 
    adminLogin,
    createUser,
    getUser,
    getUsers,
    getSortedUsers,
    getFilteredUsers,
    updateUser,
    deleteUser
};