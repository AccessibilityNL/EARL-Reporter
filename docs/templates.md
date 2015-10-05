To receive and update templates remotely, the reporter has the
following requests avaiable

# GET templates/:tplName:

This will return the template of :tplName: as a text/plain
document.


# POST template/:tplName:?key=:key:

This request will create / update a template of :tplName:. It
requires posting a Handlebars template file with the text/plain
content type header. If the template can not be compiled by 
Handlebars, a 400 error will be returned.


The :key: is used to ensure the update is permitted. The key is
a concatination of templateBody + templateName + salt, proccessed
through MD5. When implementing this project, be sure to replace 
the salt in this project with your own!