# API RATE LIMITER & THROTTLE

A Rate Limiter With Redis,

- **Before you begin, make sure you have Node and Redis installed on your machine.**

- **Redis** is an `in-memory key-value data storage`, so it can retrieve data very quickly.

1. Store a key like a user’s `IP address` like Identification matrix. 
2. Increment the number of calls made from that Identification matrix. 
3. Expire the record after a specified timeframe.

The rate limiting have few algorithms to work with like,
        1. Token Bucket
        2. Leaky Bucket
 		3. Fixed Window Counter
 		4. Sliding Window Log
 		5. Sliding Window Counter
 		6. Rolling Window
 		7. Concurrency Limit (Semaphore-based)
 		8. Request Queue / Throttling Queue
 		9. Exponential Backoff
 		10.Adaptive Rate Limiting
 		11.Distributed Rate Limiting (e.g., Redis-based)
 		12.GCRA (Generic Cell Rate Algorithm)
 		13.Quota-based Limiting
 		14.Burst-based Limiting

Identify Matrix
		[] IP Address
 		[] User ID (from Authentication / JWT / Session ID)
 		[] API Key or Token
 		[] Device Fingerprint
 		[] Geolocation

Features in paln to impilment
 		[] 10 Algorithems
 		[] Custom Headers  
                        [ Developer Option to see and test the  `how many rate limit have` and other, thing form custom headers X-RateLimit-Limit / X-RateLimit-Remaining / X-RateLimit-Reset ]
 		[] Export the data to the database in every 1 hour
 		[] provide the service as API and Give the report dashboard.
                        [ Developer should see  `which API have the rate limit and not.` ]
                        [ A suspicious increase in failed login attemps and  `sent to the original user email.` ]
 		[] Inbuild present a CAPTCHA challenge.
 		[] Check the Ip good or bad form list of exsisting like bot Ip collection
 		[] A maximum of 5 accounts are allowed to be created per day from a unique source IP address.
 		[] if attacker is try to brut force the login page catch the user id or user name and store the data to data base and inform the original user or admin.
 		[] Dealing with bursty traffic like 100k DDOS.
 		[] use the Least Recently Used (LRU) as a cache eviction policy for our system



- `If an IP address crosses the limit` you have set for the application, you `will call` [Cloudflare's API](https://api.cloudflare.com/) `and add the IP address to list`   You will then  `configure a Cloudflare Firewall Rule` that will  `ban all requests with IP addresses in the list.`
- if the request is more than the limits. The rate limiter module stores and retrieves rate limit data from a backend storage system. and make report or set up the firewall rules to block that Ip or user Id. returns an appropriate HTTP response to the client.

Method
		Request queues / Throttling
 		[]	Hard throttling
 		[]	soft throttlin
 		[]	dynamic throttling

		Rate Limite Level
		[]	API level
	 	[]	key-level
	 	[]	user level
	 	[]	application level
                []      infrastructure-level


configuration options 
        []  windowMs
        []  limit
        []  Developer Option (Custom Headers)

Step 1 :
    npm install
    sudo apt update && sudo apt install redis-server
    redis-server       # or just: sudo systemctl start redis-server
    redis-cli ping     # it print "PONG"


step 2 :
    node index.js      # connected to redis
                       # Example app listening at http://localhost:3000


step 3 :
    # `GET /` is unprotected  just returns, Hello World!.
    curl http://localhost:3000/

    # `POST /` is the rate-limited route (10 requests / 10 seconds). 
    #  Use -i to see the headers
    curl -i -X POST http://localhost:3000/
