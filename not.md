mkdir RBAC
cd RBAC

mkdir backend
cd backend

npm init -y
npm install express cors dotenv prisma @prisma/client
npx prisma init

mkdir src
cd src
mkdir rbac
cd rbac
mkdir middleware routes seed services
touch index.js
cd ..

touch app.js prisma.js
cd ..
touch server.js

cd ..
npm create vite@latest frontend
cd frontend
npm install
npm run dev


IF IMPORTING CODE FROM GITHUB-
AFTER cloning it -
cd backend
npm install
cd..
cd frontend
npm install
npm run dev

also do the below command after databse problems are done-
npx prisma generate
npx prisma migrate dev


IF THIS IS SUCCESSFULL THEN SETUP IS COMPLETE