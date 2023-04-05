import {BitmapLayer} from '@deck.gl/layers';
import {Buffer} from 'buffer';

// Define a new bitmap layer type that can receive binary image data
class BinaryBitmapLayer extends BitmapLayer {
  constructor(props) {
    super(props);
    this.binaryData = props.binaryData;
  }

  initializeState() {
    super.initializeState();
    const {gl} = this.context;
    const {width, height} = this.props;

    // Convert binary image data to a PNG format buffer
    const pngData = Buffer.from(this.binaryData).toString('base64');
    const imageData = `data:image/png;base64,${pngData}`;

    // Create a new image object from the PNG data
    const image = new Image();
    image.src = imageData;

    // Once the image has loaded, create a new texture and bind it to the layer
    image.onload = () => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      this.setState({texture});
    };
  }

  finalizeState() {
    super.finalizeState();
    const {gl} = this.context;
    const {texture} = this.state;

    // Cleanup the texture when the layer is removed
    gl.deleteTexture(texture);
  }
}

export default BinaryBitmapLayer;
