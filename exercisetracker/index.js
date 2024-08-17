const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const res = require('express/lib/response');
const Schema=mongoose.Schema;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const userSchema = new Schema({
  username: String,
});
const User = mongoose.model('User', userSchema);

const ExercisesSchema= new Schema({
  user_id: {type: String, require: true},
  description: String,
  duration: Number,
  date: Date,
});
const Exercise= mongoose.model('Exercise',ExercisesSchema);


app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req,res)=>{
   const users = await User.find({}).select("_id username") ;
   if(!users){
    res.send("No existe el usuario");    
   } else{
    res.json(users);
   }
});

app.post('/api/users', async (req, res) => {
  const userName= req.body.username;
  const userObj = new User({
    username: req.body.username
  });

  try{
    const user = await userObj.save();
    console.log(user);
    res.json(user);
  }catch(err){
    console.log(err);
  }
  /*const user = await User.create({
    userName
  });*/
  
   

  /*const usuario = new User({username:userName});
  usuario.save((err,data)=>{
    done(null, data);
  });
  res.json(usuario);*/

});

app.post('/api/users/:_id/exercises',async (req,res)=>{
  const id = req.params._id;
  const {description, duration, date}=req.body;
  try{
    const user = await User.findById(id);
    if(!user){
      res.send("No se encuentra el usuario");      
    } else{
      const exerciseObj=new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      });
      const exercise=await exerciseObj.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      });
    }
  }catch(err){
    console.log(err);
    res.send("Error al guardar la informacion");
  }
});

app.get('/api/users/:_id/logs',async (req,res)=>{
  const {from, to, limit} = req.query;
  const id= req.params._id;
  const user=await User.findById(id);
  if(!user){
    res.send("no se pudo encontrar al usuario");
    return;
  }
  let dateObj={};
  if(from){
    dateObj["$gte"]=new Date(from);
  }
  if(to){
    dateObj["$lte"]= new Date(to);
  }
  let filter={
    user_id: id
  }
  if(from || to){
    filter.date=dateObj;
  }
  const exercises=await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercises.map(e=>({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }));
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  });
  


});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
