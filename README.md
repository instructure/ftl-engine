FTL-Engine
=========
A tool for creating and running complex series of tasks pretty quick

## How it works
FTL-engine is a graph execution engine, where the nodes in the graph are individual independent tasks
that you want to execute. FTL-engine doesn't care what type of work you want to do, it just gives you an interface
for implementing `Activitiy` plugin that know how to perform a certain type of task.

You then create a `Workflow` which represents the work to be done by specifying small JS files with a certain structure
that represents the order the work needs to be done in. These files are evaluated to create the workflow (as a JSON blob), which is then
submitted and executed by FTL-engine.

tl;dr: Write some plugins for what you need to do, describe the steps with some code, build and execute the workflow

## Getting Started
Look at `test_integration` and some of the scripts. Sorry, these docs are bad right now...

## Status
This project is being actively used at Instructure for large production ETL workflows. While it is definitely code we rely on,
its missing a few features we want to add and a few APIs we want to firm up before making a first official release. Until that point, the docs
may remain sparse but feel free to contribute!
