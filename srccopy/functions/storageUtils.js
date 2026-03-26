

export function getUserName() {
    // First, check localStorage
    const uname = localStorage.getItem('uname');
    
    // If not found, check sessionStorage
    return uname !== null ? uname : sessionStorage.getItem('uname');
  }