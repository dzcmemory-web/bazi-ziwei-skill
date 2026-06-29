from setuptools import find_packages, setup

setup(
    name="license-plate-bazi",
    version="0.1.0",
    description="Traditional-culture BaZi based license plate recommendation prototype",
    package_dir={"": "src"},
    packages=find_packages("src"),
    python_requires=">=3.9",
    entry_points={
        "console_scripts": [
            "license-plate-bazi=license_plate_bazi.cli:main",
        ],
    },
)
