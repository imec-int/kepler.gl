import { BitmapLayer } from '@deck.gl/layers';


// Define a new bitmap layer type that can receive binary image data
class BinaryBitmapLayer extends BitmapLayer {
  constructor(props) {
    super(props);
    this.binaryData = props.binaryData;
  }

  initializeState() {
    super.initializeState();
    const { gl } = this.context;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, gl.R32F, gl.FLOAT, this.binaryData);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.setState({ texture });
  }

  finalizeState() {
    super.finalizeState();
    const { gl } = this.context;
    const { texture } = this.state;

    // Cleanup the texture when the layer is removed
    gl.deleteTexture(texture);
  }
}

export default BinaryBitmapLayer;
