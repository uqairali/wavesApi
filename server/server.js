const express =require('express');
const bodyParser =require('body-parser');
const cookieParser= require('cookie-parser');

const app=express();
const mongoose =require('mongoose');
require('dotenv').config();

mongoose.Promise=global.Promise;
mongoose.connect(process.env.DATABASE)

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cookieParser());

//Models
const { User } =require('./models/user');
const { Brand } =require('./models/brand');
const { Wood } =require('./models/wood');
const { Product } =require('./models/product');

//middleware
const { auth } =require('./middleware/auth');
const { admin } =require('./middleware/admin');
//////////////////////////////////////////////
//               PRODUCT                   //
//////////////////////////////////////////////
   
//BY ARRIVAL
// /articles?sortBy=createdAt&order=desc&limit=4

//BY SEL
// /articles?sortBy=sold&order=desc?limit=100&skip=5
app.get('/api/product/articles',(req,res)=>{
    let order=req.query.order?req.query.order:'asc';
    let sortBy=req.query.sortBy?req.query.sortBy:"_id";
    let limit=req.query.limit?+req.query.limit:100;

    Product.find().
    populate('brand').
    populate('wood').
    sort([[sortBy,order]]).
    limit(limit).
    exec((err,articles)=>{
        if(err) return  res.status(400).send(err);
        res.send(articles)
    })
});


// /api/product/article?id=--------&type=single
app.get('/api/product/article_by_id',(req,res)=>{
    let type=req.query.type;
    let items=req.query.id;

    if(type==='array'){
        let ids=req.query.id.split(',');
        items=[];
        items=ids.map(item=>{
            return mongoose.Types.ObjectId(item)
        })
    }
    Product.find({'_id':{$in:items}}).
    populate('brand').
    populate('wood').
    exec((err,docs)=>{
        return res.status(200).send(docs)
    })
});


app.post('/api/product/article',auth,admin,(req,res)=>{
    const product=new Product(req.body);
    product.save((err,doc)=>{
        if(err) return res.json({success:false,err});
        res.status(200).json({success:true,article:doc})
    })
})

//////////////////////////////////////////////
//               BRAND
//////////////////////////////////////////////
app.post('/api/product/wood',auth,admin,(req,res)=>{
    const wood=new Wood(req.body);
    wood.save((err,doc)=>{
        if(err) return res.json({success:false,err});
        res.status(200).json({success:true,doc});
    })
})

app.get('/api/product/woods',auth,admin,(req,res)=>{
    Wood.find({},(err,wood)=>{
        if(err) return res.status(400).send(err);
        res.status(200).send(wood)
    })
})


//////////////////////////////////////////////
//               BRAND
//////////////////////////////////////////////

app.post('/api/product/brand',auth,admin,(req,res)=>{
const brand=new Brand(req.body);

brand.save((err,doc)=>{
    if(err) return res.json({success:false,err});
    res.status(200).json({
        success:true,
        brand:doc
    })
})
})

app.get('/api/product/brands',(req,res)=>{
    Brand.find({},(err,brand)=>{
        if(err) return res.status(400).send(err);
        res.status(200).send(brand)
    })
})

//////////////////////////////////////////////
//               USERS
//////////////////////////////////////////////

app.get('/api/users/auth',auth,(req,res)=>{
    res.status(200).json({
       isAdmin:req.user.role===0?false:true,
       isAuth:true,
       email:req.user.email,
       name:req.user.name,
       lastname:req.user.lastname,
       role:req.user.role,
       cart:req.user.cart,
       history:req.user.history
    })
})

//regiseter
app.post('/api/users/register',(req,res)=>{
    const user=new User(req.body);
    user.save((err,doc)=>{
        if(err){
            res.json({
                success:false,
                err
            })
        }else{
            res.status(200).json({
                success:true,
                //userdata:doc
            })
        }
    })
})

//login
app.post('/api/users/login',(req,res)=>{
//find the email
//check password
//generate a token
User.findOne({'email':req.body.email},(err,user)=>{
    if(!user)return res.json({loginSuccess:false,message:'Auth failed, email not found'})

    user.comparePassword(req.body.password,(err,isMatch)=>{
        if(!isMatch)return res.json({loginSuccess:false,message:'Wrong password'});

        //generate token
        user.generateToken((err,user)=>{
            if(err) return res.status(400).send(err);
            res.cookie('w_auth',user.token).status(200).json({
                loginSuccess:true
            })
        })
    })
    
    

})
})
const port=process.env.PORT||3002;


app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})