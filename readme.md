# CollabSpace

Viewable at (https://collabspace.concord.org/)[https://collabspace.concord.org/].

## Dashboard Params

- From portal report: offering, token, username
- From collabspace: jwtToken, documentId?, classHash?

### Token Generation

- Dashboard
  - If coming from portal report link with auth token use offering url to construct a jwtToken request
    JWT needs learner or teacher info plus domain
  - If coming from collabspace then jwtToken will be generated by collabspace

- Portal
  - Need api endpoint to create JWT token with all or specific claims in params
  - Same all or optional claims needs to be used in Firebase token
  - use same grant lookup in JWT generation
  - add offering id to JWT and use that in auth.ts - change activity to offering

- Collabspace change
  - Change JWT token generation to portal token generation in auth

### Portal Launch

token: [authtoken]
domain: [url]
domain_uid: [number]
hash: template=[uuid]

### Portal Reports

- Teacher
  offering: http://[portal]/api/v1/offerings/1/for_teacher
    [{"teacher":"Doug Martin","clazz":"Test Class","clazz_id":1,"clazz_info_url":"http://localhost:9000/api/v1/classes/1","activity":"Test Launch","activity_url":"http://127.0.0.1:8080/#template=P0f3fXDNVQdQkrQruxtlaUF4FNp1:33a73eef-62f0-442e-9742-984f57691b18","students":[{"name":"Test Student","username":"tstudent","user_id":9,"started_activity":true,"endpoint_url":"http://localhost:3000/dataservice/external_activity_data/566a38e3-a4c1-4216-ba2f-ef95c9c709d7"}]}]
  token: [authtoken]
  username:[username]
- Class
  offering: http://[portal]/api/v1/offerings/1/for_class
    [{"teacher":"Doug Martin","clazz":"Test Class","clazz_id":1,"clazz_info_url":"http://localhost:9000/api/v1/classes/1","activity":"Test Launch","activity_url":"http://127.0.0.1:8080/#template=P0f3fXDNVQdQkrQruxtlaUF4FNp1:33a73eef-62f0-442e-9742-984f57691b18","students":[{"name":"Test Student","username":"tstudent","user_id":9,"started_activity":true,"endpoint_url":"http://localhost:3000/dataservice/external_activity_data/566a38e3-a4c1-4216-ba2f-ef95c9c709d7"}]}]
  token: [authtoken]
  username: [username]
- Offering
  offering: http://[portal]/api/v1/offerings/1
    {"teacher":"Doug Martin","clazz":"Test Class","clazz_id":1,"clazz_info_url":"http://localhost:9000/api/v1/classes/1","activity":"Test Launch","activity_url":"http://127.0.0.1:8080/#template=P0f3fXDNVQdQkrQruxtlaUF4FNp1:33a73eef-62f0-442e-9742-984f57691b18","students":[{"name":"Test Student","username":"tstudent","user_id":9,"started_activity":true,"endpoint_url":"http://localhost:3000/dataservice/external_activity_data/566a38e3-a4c1-4216-ba2f-ef95c9c709d7"}]}
  token: [authtoken]
  username: [username]

All same response except teacher and class are arrays

