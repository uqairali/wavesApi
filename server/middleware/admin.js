let admin=(req,res,next)=>{
    if(req.user.role===1){
    return res.send('you are not allowed.')
    }
    next()
}

module.exports={ admin }