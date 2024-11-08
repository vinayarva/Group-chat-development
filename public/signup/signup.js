function signupForm(event){
    event.preventDefault();
    const details = {
        username : event.target.username.value,
        email: event.target.email.value,
        phoneNumber : event.target.phone.value,
        password : event.target.password.value
    }
    console.log(details);
    
    axios.post("http://localhost:4000/signup", details).then((result) => {
       alert(result.data.message); 
    }).catch((err) => {
        alert(err.response.data.message)
    });


    document.getElementById("myForm").reset();
}