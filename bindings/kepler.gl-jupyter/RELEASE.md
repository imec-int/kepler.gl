# Kepler.gl Jupyter Releases

## Release a new version

When release a new version, the `keplergl-jupyter` js module will be published on NPM and the `keplergl` python module will be published on PyPI.

NOTE: __Version number of the js module **`kelergl-jupyter`** and the python module **`keplergl`** should match__

### Step1:

Update `version_info` in  keplergl/_version.py. in bindings/kepler.gl-jupyter folder. Update `EXTENSION_SPEC_VERSION` to match the js module version

```
git add keplergl/_version.py
git commit -am "keplergl==<version>"
```


### Step2:

Create a tag: `<version>-jupyter` e.g. v0.3.2-jupyter

```
git tag -a <version>-jupyter -m "<version>-jupyter"
git push origin master && git push origin <version>-jupyter
```

The new tag will trigger the Github Action `build-publish-pypi.yml`: __"Build KeplerGL Python and NPM packages"__. The packages will be built and tested, then published to NPM and PyPI using the secret tokens.

### Step3:

For conda-forge release, please use the repo: https://github.com/lixun910/staged-recipes/tree/keplergl-feedstock

Edit `meta.yaml` under directory `staged-recipes/recipes/kepler/gl`:

* Update the version number 

```python
{% set version = "0.3.0" %}
```

* Update the sha256 value of the latest tarball in PyPi that is published in Step2.

```python
source:
  url: https://pypi.io/packages/source/{{ name[0] }}/{{ name }}/{{ name }}-{{ version }}.tar.gz
  sha256: cb21047b2104413af1c00ef1ac75794a19e0b578e51c69c86713911d97370167
```

* Create a pull request and wait for manual checking from conda-forge team.
