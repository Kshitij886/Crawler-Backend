const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const users = [
  {
    id: 1,
    email: "abc@gmail.com",
    password: "12345",
  },
  {
    id: 2,
    email: "xyz@gmail.com",
    password: "12345",
  },
];
app.post("/api/sign-in", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email : user.email,
      },
    });
  } else {
    res.status(404).json({ 
        success : false,
        message: "User not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listining to the port ${PORT}`);
});
