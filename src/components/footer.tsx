import { $ } from 'bun';
import { createSignal, onMount } from 'solid-js';
import { colors } from '@/util/colors';
import { TextAttributes } from '@opentui/core';

export default function Footer() {
    const [pwd, setPwd] = createSignal('');
    const version = getVersion();

    onMount(async () => {
        const cwd = process.cwd(); 
        const home = process.env.HOME || '';
        const path = cwd.startsWith(home) ? cwd.replace(home, '~') : cwd;
        setPwd(path);

        const branch = await getCurrentBranch();
        if (branch) {
            setPwd(`${path}:${branch}`);
        }
    });

    async function getCurrentBranch() {
        return $`git rev-parse --abbrev-ref HEAD`
            .quiet()
            .nothrow()
            .text()
            .then((x) => x.trim());
    }

    function getVersion() {
        const version = typeof OPENDOCKER_VERSION !== 'undefined' ? OPENDOCKER_VERSION : 'local';
        return 'v' + version;
    }

    return (
       <box
           width="100%"
           height="auto"
           flexDirection="row"
           justifyContent="space-between"
           paddingLeft={1}
           paddingRight={1}
           paddingBottom={1}
       >
           <box>
               <text fg={colors.textMuted}>{pwd()}</text>
           </box>
           <box flexDirection="row" gap={1}>
               <box
                   flexDirection="row"
                   gap={1}
               >
                   <box flexDirection="row">
                       <text fg={colors.textMuted} attributes={TextAttributes.BOLD}>
                           open
                       </text>
                       <text fg={colors.text} attributes={TextAttributes.BOLD}>
                           docker
                       </text>
                   </box>
               </box>
               <text fg={colors.textMuted}>{version}</text>
           </box>
       </box>

    )
}
