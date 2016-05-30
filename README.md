# Course Mapper

### Pre-requisities:
1. MongoDB
2. NodeJS
3. npm

### Install some command line tools
```
sudo npm install -g bower
sudo npm install -g gulp
sudo npm install -g grunt
sudo npm install -g nodemon
```
### This will install the needed modules
```
npm install
bower install

run mongoDB if it is not yet running
```
### Run pre-script compiler
`grunt`

### Run the application
`node ./bin/wwww`

### Create Admin
Once the application running for the first time, you can start adding categories as an admin.
Because this is your first time running the site, you need to create an admin user by visiting this URL in your browser. 
Please modify the [username] part to your prefered username, and please makesure make it without the square bracket.

`http://localhost:3000/accounts/createAdmin/[username]`

Once you create this admin, please comment out lines 9 - 13 of file /routes/accounts.js
and you can login to the system using your new username and password "1"
```
/*
router.get('/accounts/createAdmin/:username', function (req, res, next) {
    var account = new Account();
    account.createAdmin(req.params.username);
    res.status(200).json({status: true});
});
*/
```

