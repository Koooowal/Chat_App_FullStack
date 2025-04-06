import mongoose,{Schema} from "mongoose";

const userSchema = new Schema({
  username: {
    type: String, 
    required: true, 
    unique: true
  },
  password: String,
},{timestamps: true});


export default mongoose.model("User",userSchema);