uniform sampler2D uTexture;
uniform sampler2D displacementMap;
uniform float uTime;

varying vec2 vUv;
varying float colorOffset;
varying float dist;

void main()
{
    vec4 textureColor = texture2D(uTexture, vUv);
    if (colorOffset != 0.0){
        textureColor.r = 1.0 - pow(colorOffset,0.5);
        textureColor.g += .05;
        textureColor.b += .05;
        textureColor.a = 0.4; 
    } else {
        textureColor.r = 0.0;
        textureColor.g += .05;
        textureColor.b += .05;
        textureColor.a = 0.4;
    }
    gl_FragColor = textureColor;
}