/* One command rebuilds, validates, browser-checks and packages the full bank.
   Publication remains the normal reviewed Git workflow. No keys/network needed. */
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const [command,args] of [
  [process.execPath,['tools/build_practice_pipeline.cjs']],
  [process.execPath,['tools/build_practice_pipeline.cjs','--check']],
  [process.execPath,['tools/check_practice_pipeline.cjs']],
  [process.execPath,['tools/smoke_studio.cjs']],
  ['python',['tools/build_dist.py']],
  ['python',['tools/check_deploy.py']]
]){
  const result=spawnSync(command,args,{cwd:root,stdio:'inherit',shell:false});
  if(result.error){console.error(result.error.message);process.exit(1);}
  if(result.status!==0)process.exit(result.status||1);
}
console.log('Practice bank rebuilt, validated and packaged.');
