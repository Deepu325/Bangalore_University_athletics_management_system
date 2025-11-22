const Header = () => (
  <header
    style={{
      display: "flex",
      alignItems: "center",
      padding: "10px 20px",
      backgroundColor: "#f3f4f6",
      color: "#1f2937",
      borderBottom: "2px solid #667eea"
    }}
  >
    <img 
      src="/Bangalore_University_logo.png" 
      alt="BU Logo" 
      style={{ 
        height: "50px", 
        marginRight: "15px",
        objectFit: "contain"
      }} 
    />

    <div>
      <h2 style={{ margin: "0", fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
        Bangalore University
      </h2>
      <p style={{ margin: "2px 0", fontSize: "12px", color: "#6b7280" }}>
        Athletic Meet Management System
      </p>
    </div>
  </header>
);

export default Header;
