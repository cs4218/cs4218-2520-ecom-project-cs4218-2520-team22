# CS4218 Project - Virtual Vault

## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not already done) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. SonarQube Setup

1. **Install JDK 21**

   - Ensure your Java version is JDK 21 before starting SonarQube.

2. **Install SonarQube Server (Community Edition)**

   - Download and install SonarQube Community Edition from SonarSource.

3. **Start SonarQube from zip installation guide**

   - Follow the official guide:
     https://docs.sonarsource.com/sonarqube-server/server-installation/from-zip-file/starting-stopping-server/from-zip-file

4. **Open SonarQube in browser**

   - Visit `http://localhost:9000`.

5. **Create account and token**

   - Create a SonarQube account.
   - Generate a User Token, and add it to `sonar-project.properties`

6. **Install Sonar scanner package**

   - Run:

     ```bash
     npm install sonarqube-scanner@latest
     ```

### 4. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Testing and Code Quality

This project uses multiple test layers:

- **Frontend unit/component tests** with Jest + jsdom
- **Backend unit/integration-style tests** with Jest + Node
- **Server integration tests** with Jest + `supertest` + `mongodb-memory-server`
- **End-to-end UI tests** with Playwright
- **Static analysis and coverage reporting** with SonarQube

### 5.1 Test Commands

Run these commands from the project root:

- **Frontend tests**

   ```bash
   npm run test:frontend
   ```

- **Backend tests**

   ```bash
   npm run test:backend
   ```

- **Integration tests (server_test)**

   ```bash
   npm run test:integration
   ```

- **E2E tests (Playwright)**

   ```bash
   npm run test:e2e
   ```

- **Unit tests (Playwright)**
  ```bash
  npm run test:ui
  ```

- **AI-driven tests (In progress)**
  ```bash
  npm run test:ai
  ```

- **All tests**

   ```bash
   npm run test
   ```

### 5.2 Jest Config Files

- `jest.frontend.config.js`: frontend tests under `client/src/**/*.test.js(x)`
- `jest.backend.config.js`: backend tests under root-level folders (`controllers`, `models`, `helpers`, `config`, `middlewares`)
- `jest.integration.config.js`: integration tests under `server_test/**/*.integration.test.js`

### 5.3 SonarQube Scan

The Sonar scanner reads project settings from `sonar-project.properties`.

1. Ensure SonarQube server is running (default: `http://localhost:9000`).
2. Run scan:

    ```bash
   npm run sonarqube
    ```


## 6. Project Contributions
### Milestone 1
| Name | Client Related Files (/client/src/) | Server Related Files (./)
| :---- | :---- | :----
| LAI XIONG XING DANIEL | <ul><li>context/auth.js</li><li>pages/Auth/Register.js </li><li> pages/Auth/Login.js</li><li> pages/Auth/ForgotPassword.js</li>| <ul><li>helpers/authHelper.js</li><li>middlewares/authMiddleware.js</li><li>controllers/authController.js<ul><li>registerController</li><li>loginController</li><li>forgotPasswordController</li><li>testController</li>
| WANG QINZHE | <ul><li>components/AdminMenu.js </li><li>pages/admin/AdminDashboard.js</li><li>components/Form/CategoryForm.js</li><li>pages/admin/UpdateProduct.js</li><li>pages/admin/CreateCategory.js</li><li>pages/admin/CreateProduct.js</li><li>pages/admin/AdminOrders.js</li><li>pages/admin/Products.js </li><li>pages/admin/Users.js</li></ul> | <ul><li>controllers/categoryController.js <ul><li>createCategoryController </li><li>updateCategoryController</li><li>deleteCategoryController</li></ul></li><li>controllers/productController.js <ul><li>createProductController </li><li>updateProductController</li><li>deleteProductController</li></ul></li></ul> 
| SONG YICHAO | <ul><li>components/Routes/Private.js </li><li>components/UserMenu.js </li><li>pages/user/Dashboard.js</li><li>pages/user/Orders.js</li><li>pages/user/Profile.js</li><li>components/Form/SearchInput.js </li><li>pages/Search.js</li><li>context/search.js</li></ul> | <ul><li>models/userModel.js</li><li>models/orderModel.js</li><li>controllers/authController.js<ul><li>updateProfileController</li><li>getOrdersController</li><li>getAllOrdersController</li><li>orderStatusController</li></li><li>registerController</li><li>loginController</li><li>forgotPasswordController</li><li>testController</li></ul>
| MANSOOR SYED ALI | <ul><li>pages/ProductDetails.js</li><li>pages/CategoryProduct.js</li><li>pages/Contact.js</li><li>pages/Policy.js</li><li>components/Footer.js</li><li>components/Header.js</li><li>components/Layout.js</li><li>components/Spinner.js</li><li>pages/About.js</li><li>pages/Pagenotfound.js</li></ul> | <ul><li>controllers/productController.js<ul><li>getProductController</li><li>getSingleProductController</li><li>productPhotoController</li><li>productFiltersController</li><li>productCountController</li><li>productListController</li><li>searchProductController</li><li>relatedProductController</li><li>productCategoryController</li></ul></li><li>models/productModel.js</li><li>config/db.js</li></ul>
| LIM JUN XIAN | <ul><li>pages/Homepage.js</li><li>context/cart.js</li><li>pages/CartPage.js</li><li>hooks/useCategory.js</li><li>pages/Categories.js</li></ul> | <ul><li>controllers/categoryController.js<ul><li>categoryController</li><li>singleCategoryController</li></ul><li>controllers/productController.js<ul><li>braintreeTokenController</li><li>brainTreePaymentController</li></ul><li>models/categoryModel.js</li>

### Milestone 2
| Name | Integration Tests | UI Tests | Miscellaneous |
| :---- | :---- | :---- | :---- |
| LAI XIONG XING DANIEL | <ul><li>authHelper.integration.test</li><li>authMiddleware.integration.test</li><li>userModel.integration.test</li><li>authController.integration.test</li></ul> | <ul><li>profile.spec.js</li><li>admin.spec.js</li><li>auth.spec.js</li><li>cart-checkout.spec.js</li></ul> | <ul><li>AdminRoute.test</li><li>App.test</li><li>Minor edits of README setup instructions</li></ul>
| WANG QINZHE | <ul><li>category.integration.test</li><li>order.integration.test</li><li>product.integration.test</li></ul> | <ul><li>admin.spec.js</li><li>auth.spec.js<li>browse.spec.js</li><li>cart-checkout.spec.js</li></ul> | <ul><li>e2e/helpers/auth.js</li><li>e2e/helpers/globalSetup.js</li><li>e2e/helpers/globalTeardown.js</li><li>server_test/helpers/auth.js</li><li>server_test/helpers/db.js</li><li>server_test/helpers/seed.js</li><li>server_test/helpers/testApp.js</li></ul>
| SONG YICHAO | <ul><li>SearchFlow.integration.test.js</li><li>PrivateRoute.integration.test.js</li><li>Profile.integration.test.js</li><li>Orders.integration.test.js</li></ul> | <ul><li>user-flows.spec.js</li></ul> | <ul><li>Bug fix: Search.js (implemented navigation and add-to-cart handlers)</li><li>Updated unit and integration tests to include CartProvider and Router</li><li>Implemented AI-assisted testing workflow (artifact parsing + report generation)</li></ul> |
| MANSOOR SYED ALI | <ul><li>displayCategoryProducts.test</li><li>displayProductInfo.test</li><li>displayRelatedProductInfo.test</li></ul> | <ul><li>addCategoryProductToCart.test.js</li><li>addProductToCart.test.js</li><li>viewCategoryProductDetails.test.js</li></ul> | <ul>NIL</ul> |
| LIM JUN XIAN | <ul><li>filterProducts.integration.test</li><li>getAllCategories.integration.test</li><li>getAllProducts.integration.test</li></ul> | <ul><li>addToCart.spec.js</li><li>makePayment.spec.js</li><li>updateUserAddress.spec.js</li></ul> | <ul><li>Bug fix: ProductDetails.js (added function to ADD TO CART button)</li></ul> |

### Milestone 3
| Name | Non-functional tests | Miscellaneous |
| :---- | :---- | :---- |
| LAI XIONG XING DANIEL |  |  | 
| WANG QINZHE |  |  | 
| SONG YICHAO |  |  | 
| MANSOOR SYED ALI | <ul><li>soak.js</li></ul> | <ul><li>plot_http_req_waiting_p95.py</li></ul> | 
| LIM JUN XIAN | <ul><li>load_testing/PaymentLoadTesting.jmx</li><li>load_testing/ProfileMangementLoadTesting.jmx</li></ul> | <ul><li>testUsers.csv (user data for testing)</li><li>testUsers.json (user data to import for MongoDB)</li></ul> | 

## 7. CI Workflows

### MS1 CI URL

https://github.com/cs4218/cs4218-2520-ecom-project-cs4218-2520-team22/actions/runs/22276067731/job/64438320117?pr=11 

