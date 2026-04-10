import React from 'react'
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer" role="contentinfo">
        <p className="text-center">All Rights Reserved &copy; TestingComp</p>
        <p className="text-center mt-3">
        <Link to="/about">About</Link>|<Link to="/contact">Contact</Link>|
        <Link to="/policy">Privacy Policy</Link>
      </p>
    </footer>
  );
};

export default Footer;