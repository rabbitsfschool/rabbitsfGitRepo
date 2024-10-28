app.py
-------
Customize your gam path
   GAM_PATH = "<your gam command path>"

For USERNAME/PASSWORD, set them on your production server's shell configuration:
   echo 'export GAM_ADMIN_USERNAME=<your_username>' >> ~/.zshrc
   echo 'export GAM_ADMIN_PASSWORD=<your_password>' >> ~/.zshrc
   source ~/.zshrc


config.json
-------
Change the commands to match yours
Add whatever commands you need based on the options format
For the Classroom section, you need to change the gsheet to your own Google sheet for your commands. Contact me if you need to find out the Google sheet's format.


Install
-------
GAM Advanced
Python
pip install flask
pip install flask-cors
pip install Flask_Limiter
(I may miss some. You will figure out when you started the application. The terminal will show you.)
 


