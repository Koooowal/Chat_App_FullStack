import mongoose,{Schema} from "mongoose";

const messageSchema = new Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: false
  },
  file:{
    type: String,
    required: false
  }
},{timestamps: true});


export default mongoose.model("Message",messageSchema);