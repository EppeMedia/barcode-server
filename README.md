# barcode_backend


## Before starting install these programs
- npm
- docker desktop
- pgAdmin
- Postman

## Setting things up

### The Database

To install the the database follow these steps:
 
 -   Get the docker container running by executing ``` docker-compose up -d``` 
 -   When the command finished a postgres instance will be availible on localhost:5432
 -   After this open pgAdmin and connect with the info in the docker-compose.yml file
 -   Once connected create a new database simply called "public"
 -   Copy the contents of Schema.sql and run this script using the query tool (leftmost button in the browser section of pgAdmin), after this the database should be ready to use

### Creating an account

 -   Start Postman and create a new PUT-request with url localhost:8000/user/register
 -   Go to the body tab, select raw and JSON (dropdown next to radiobuttion) and paste the following JSON object:

``` 
{
    "name": "Ferdinand",
    "email": "ferdinand@ferdmail.com",
    "password": "STARIsMyFavouriteSubject!"
}
```
 -  After this log in with your created account using a POST-request to localhost:8000/user/login:
 ```
 {
    "email": "ferdinand@ferdmail.com",
    "password": "STARIsMyFavouriteSubject!"
}
 ```
 - Copy the token and create a new GET-request to localhost:8000/, select the authorization tab and pick the type "Bearer Token", paste your token and run the request. You should see the following message if everything went without error:

 ``` 
 {
    "message": "jwt token valid!"
}
 ```