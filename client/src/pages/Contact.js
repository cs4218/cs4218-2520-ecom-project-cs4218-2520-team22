import React from "react";
import Layout from "./../components/Layout";
import { BiMailSend, BiPhoneCall, BiSupport } from "react-icons/bi";
const Contact = () => {
  return (
    <Layout title={"Contact us"}>
      <div className="row contactus ">
        <div className="col-md-6 ">
          <img
            src="/images/contactus.jpeg"
            alt="contactus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <h1 className="bg-dark p-2 text-white text-center">CONTACT US</h1>
          <p className="text-justify mt-2">
            For any query or info about product, feel free to call anytime. We
            are available 24X7.
          </p>
          <p className="mt-3">
            <BiMailSend /> :{" "}
            <a href="mailto:help@ecommerceapp.com">help@ecommerceapp.com</a>
          </p>
          <p className="mt-3">
            <BiPhoneCall /> : <a href="tel:012-3456789">012-3456789</a>
          </p>
          <p className="mt-3">
            <BiSupport /> : <a href="tel:1800-0000-0000">1800-0000-0000</a>{" "}
            (toll free)
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
