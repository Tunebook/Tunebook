import React from "react";

function AboutUs() {
  return (
    <div className="about-us-container" style={{ padding: "20px", textAlign: "center", marginTop: "45px", marginBottom: "70px"  }}>
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          backgroundColor: "#122",
          borderRadius: "8px",
          boxShadow: "4px 8px #86e3e6",
          border: "solid 2px #58b0d2",
          padding: "30px",
        }}
      >
        <h3
          style={{
            color: "white",
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          Why Tunebook Is Different
        </h3>

        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.8",
            color: "white",
            marginBottom: "20px",
          }}
        >
          Welcome to <strong>Tunebook</strong>, where preserving music and building
          community is at the heart of everything we do. Unlike apps like
          Instagram or Facebook, we don’t rely on centralized servers or managed
          accounts. Instead, we use cutting-edge tools to create a secure,
          user-first experience that’s easy to access and built to last.
        </p>
        <h3
          style={{
            color: "white",
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "15px",
            marginTop: "70px",
            textDecoration: "underline"
          }}
        >
          You’ll log in using one of two options:
        </h3>
        <ul
          style={{
            paddingLeft: "20px",
            textAlign: "left",
            color: "white",
            lineHeight: "1.8",
            fontSize: "16px",
            marginBottom: "20px",
          }}
        >
          <li>
            <strong style={{ color: "Yellow" }}>Internet Identity:</strong> A simple,
            secure login method designed for the apps of tomorrow.
          </li>
          <li>
            <strong style={{ color: "yellow" }}>NFID:</strong> Login with your email or
            Google account, making it just as familiar and easy as other apps you
            use daily.
          </li>
        </ul>
        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.8",
            color: "white",
            marginBottom: "15px",
            marginTop: "50px",

          }}
        >
          These tools empower us to offer you a seamless experience while
          ensuring that your data stays private, secure, and permanent. It’s all
          part of our commitment to building a better platform for our vibrant
          music community.
        </p>
        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.8",
            color: "white",
            marginTop: "40px",

          }}
        >
          Explore <strong>Tunebook</strong> knowing you’re part of something
          designed to last for generations.
        </p>
      </div>
    </div>
  );
}

export default AboutUs;
