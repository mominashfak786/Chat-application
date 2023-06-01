const isLogin = async(req,res,next)=>{
 
     try{
            if(!req.session.user){
               return  res.redirect('/')
            }

            next();
     }catch(e)
     {
        console.log(e.message);
     }

}
const isLogout = async(req,res,next)=>{
 
    try{
           if(req.session.user){
               return res.redirect('/dashboard')
           }

           next();
    }catch(e)
    {
       console.log(e.message);
    }

}

module.exports={
    isLogin,
    isLogout
}