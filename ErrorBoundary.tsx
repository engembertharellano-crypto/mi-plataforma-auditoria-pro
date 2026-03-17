import React from "react";

class ErrorBoundary extends React.Component<any, any> {

  constructor(props:any){
    super(props);
    this.state = { hasError:false };
  }

  static getDerivedStateFromError(){
    return { hasError:true };
  }

  componentDidCatch(error:any, info:any){
    console.error("APP ERROR:", error, info);
  }

  render(){

    if(this.state.hasError){

      return(
        <div style={{
          height:'100vh',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          background:'#020617',
          color:'white',
          fontFamily:'sans-serif',
          flexDirection:'column',
          gap:'20px'
        }}>

          <h1>⚠️ Error en la aplicación</h1>

          <p>
          La aplicación sigue funcionando pero ocurrió un error.
          </p>

          <button
          onClick={()=>window.location.reload()}
          style={{
            padding:'12px 20px',
            background:'#2563eb',
            border:'none',
            borderRadius:'8px',
            color:'white',
            cursor:'pointer'
          }}
          >
          Recargar aplicación
          </button>

        </div>
      )
    }

    return this.props.children
  }

}

export default ErrorBoundary
