const User = require('../models/user')
const bcrypt = require('bcrypt')

module.exports.signup = async(req,res)=>{
    try{
        const data = req.body

        const checkEmail = await User.findOne({where :{email: data.email}})

        if(checkEmail){
            res.status(409).json({success: true, message: 'Email already Exists'})
        }else{

            const encryptPassword = await bcrypt.hash(data.password, 10);

            data.password = encryptPassword

            const result = await User.create(data)
            res.status(201).json({success: true, message:"Account Created successfully"})
        }

    
    }catch(err){
        console.log(err)
        res.status(501).json({success:false,message:"Error internal Server Error"})
    }
    
}