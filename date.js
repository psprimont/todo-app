//generate today's date, formatted
function getDate() {
    const today = new Date();
  
    const options = {
      day: "numeric",
      weekday: "long",
      month: "long",
    };
  
    return today.toLocaleDateString("en-US", options);
  };
  
  export { getDate };