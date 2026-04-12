import React from "react";
import Layout from "./../components/Layout";

const Policy = () => {
  const policyParagraphs = [
    "We collect only the information needed to provide our services, such as account details, contact information, and order history.",
    "Information may be shared with external parties as needed, and by continuing to use this platform you are consenting to this usage of your personal information."
  ];

  return (
    <Layout title={"Privacy Policy"}>
      <div className="row contactus ">
        <div className="col-md-6 ">
          <img
            src="/images/contactus.jpeg"
            alt="contactus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          {policyParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Policy;
