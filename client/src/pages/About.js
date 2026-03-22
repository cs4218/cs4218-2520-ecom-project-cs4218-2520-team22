import React from "react";
import Layout from "./../components/Layout";

const About = () => {
  return (
    <Layout title={"About us - Ecommerce app"}>
      <div className="row contactus ">
        <div className="col-md-6 ">
          <img
            src="/images/about.jpeg"
            alt="contactus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <p className="text-justify mt-2">
            Virtual Vault is a student-built ecommerce platform focused on a
            smooth, reliable shopping experience. Our goal is to make product
            discovery, checkout, and order tracking simple for users, while
            providing practical admin tools for catalog and order management.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;