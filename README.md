- needs ws node module, ngrok, coturn.
- setup ngrok(details on ngrok's website)  
- install coturn  
   to setup coturn  
create file turnserver.conf->  
```
listening-port=3478  
fingerprint  
lt-cred-mech  
realm=localhost  
user=webrtcuser:webrtcpass  
no-cli  
no-tls  
no-dtls  
```
1) ```ngrok http 3000```  
  Output:  
Forwarding                    https://xxxxxx.ngrok-free.app -> http://localhost:3000

2) copy xxxxxx.ngrok-free.app       
3) run -> ```turnserver -c ./turnserver.conf```  
4) run -> ```SIGNALING_URL=wss://{copied text} node server.js```

visit the url https://xxxxxx.ngrok-free.app through multiples devices and chat!
