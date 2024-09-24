# Deployment Monitor

Deployment frequency is one of the key DORA metrics, and it enables you to measure your team's velocity. This extension adds a widget to your Dashboard that shows how often and how many times your application is deployed to each environment.
To learn more about DORA, checkout [this article](https://dora.dev/guides/dora-metrics-four-keys/).

## Preview

![](https://github.com/danilocolombi/deployment-monitor/blob/main/documentation/images/extension-preview.png?raw=true)

## Install

The extension can be installed from [Azure DevOps Marketplace](https://marketplace.visualstudio.com/items?itemName=danilocolombi.deployment-monitor).

## Calculation
This extension calculates the deployment frequency based on the number of deployments records of a given environment in the last year, and it uses the below rule from [this article](https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance) to determine the frequency:

"Deployment Frequency falls into the Daily bucket when the median number of days per week with at least one successful deployment is equal to or greater than three. To put it more simply, to qualify for “deploy daily,” you must deploy on most working days. Similarly, if you deploy most weeks, it will be weekly, and then monthly and so forth."

## Contributing

This project welcomes contributions and suggestions.

## License

this project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Other Extensions

I'm also author of the following extensions, which you might find useful:

- [Pipelines Monitor Widget](https://marketplace.visualstudio.com/items?itemName=danilocolombi.pipelines-monitor)

- [Language Breakdown Widget](https://marketplace.visualstudio.com/items?itemName=danilocolombi.language-breakdown-widget)
